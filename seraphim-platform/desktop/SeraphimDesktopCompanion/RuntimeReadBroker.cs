using System.Net;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace SeraphimDesktopCompanion;

internal sealed class RuntimeReadBroker
{
    private const string RequiredOrigin = "https://app.seraphim.local";
    private const int MaxResponseBytes = 1_048_576;
    private static readonly HttpClient Client = new() { Timeout = TimeSpan.FromSeconds(6) };

    private readonly RuntimePairingProfile? profile;

    internal RuntimeReadBroker()
    {
        profile = RuntimePairingProfile.TryLoad();
    }

    internal async Task<RuntimeBrokerResponse> ReadAsync(string requestId, string path)
    {
        if (!IsSafeReadPath(path))
        {
            return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.BadRequest, "runtime_path_rejected", "Desktop rejected an unsafe Runtime path.");
        }

        if (profile is null)
        {
            return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.Unauthorized, "pairing_required", "No current Desktop Runtime pairing profile is available.");
        }

        if (!Dpapi.TryUnprotect(profile.ProtectedCredential, out var credential))
        {
            return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.Unauthorized, "pairing_required", "Desktop Runtime pairing is unavailable for this Windows user.");
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(profile.Endpoint, path));
            AddProofHeaders(request, profile, credential, path);
            using var response = await Client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
            if (response.Content.Headers.ContentLength is > MaxResponseBytes)
            {
                return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.RequestEntityTooLarge, "runtime_malformed", "Runtime response exceeded the Desktop limit.");
            }

            var payload = await response.Content.ReadAsStringAsync();
            if (Encoding.UTF8.GetByteCount(payload) > MaxResponseBytes)
            {
                return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.RequestEntityTooLarge, "runtime_malformed", "Runtime response exceeded the Desktop limit.");
            }

            if (!response.IsSuccessStatusCode)
            {
                return RuntimeBrokerResponse.Failure(requestId, response.StatusCode, ErrorCode(response.StatusCode), "Runtime rejected the read request.");
            }

            using var document = JsonDocument.Parse(payload);
            return RuntimeBrokerResponse.Success(requestId, response.StatusCode, document.RootElement.Clone());
        }
        catch (HttpRequestException)
        {
            return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.ServiceUnavailable, "runtime_offline", "Runtime loopback service is offline.");
        }
        catch (TaskCanceledException)
        {
            return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.GatewayTimeout, "runtime_offline", "Runtime loopback service did not respond in time.");
        }
        catch (JsonException)
        {
            return RuntimeBrokerResponse.Failure(requestId, HttpStatusCode.OK, "runtime_malformed", "Runtime returned malformed JSON.");
        }
        finally
        {
            CryptographicOperations.ZeroMemory(credential);
        }
    }

    private static bool IsSafeReadPath(string path)
    {
        return path.StartsWith("/v1/", StringComparison.Ordinal) &&
               path.Length <= 2048 &&
               !path.Contains("..", StringComparison.Ordinal) &&
               !path.Contains('#') &&
               !path.Contains('\\') &&
               !path.Contains('\r') &&
               !path.Contains('\n');
    }

    private static void AddProofHeaders(HttpRequestMessage request, RuntimePairingProfile pairing, byte[] credential, string path)
    {
        var nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
        var timestamp = DateTimeOffset.UtcNow.ToString("O");
        var proof = new SortedDictionary<string, object?>
        {
            ["body_sha256"] = Convert.ToHexString(SHA256.HashData(Array.Empty<byte>())).ToLowerInvariant(),
            ["bridge_id"] = pairing.BridgeId,
            ["method"] = "GET",
            ["nonce"] = nonce,
            ["origin"] = pairing.Origin,
            ["pairing_id"] = pairing.PairingId,
            ["path"] = path,
            ["timestamp"] = timestamp
        };
        var canonical = JsonSerializer.Serialize(proof, new JsonSerializerOptions { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        var signature = Convert.ToHexString(HMACSHA256.HashData(credential, Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
        request.Headers.Add("X-Seraphim-Owner", pairing.OwnerId);
        request.Headers.Add("X-Seraphim-Pairing", pairing.PairingId);
        request.Headers.Add("X-Seraphim-Nonce", nonce);
        request.Headers.Add("X-Seraphim-Timestamp", timestamp);
        request.Headers.Add("X-Seraphim-Signature", signature);
        request.Headers.Add("X-Seraphim-Origin", pairing.Origin);
        request.Headers.Add("X-Seraphim-Bridge", pairing.BridgeId);
    }

    private static string ErrorCode(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.Unauthorized => "pairing_required",
        HttpStatusCode.Forbidden => "owner_scope_required",
        HttpStatusCode.ServiceUnavailable => "runtime_unavailable",
        _ => "runtime_read_failed"
    };
}

internal sealed record RuntimeBrokerResponse(string Kind, string RequestId, bool Ok, int Status, JsonElement? Payload, string? ErrorCode, string? ErrorMessage)
{
    internal static RuntimeBrokerResponse Success(string requestId, HttpStatusCode status, JsonElement payload) =>
        new("runtime_read_result", requestId, true, (int)status, payload, null, null);

    internal static RuntimeBrokerResponse Failure(string requestId, HttpStatusCode status, string code, string message) =>
        new("runtime_read_result", requestId, false, (int)status, null, code, message);
}

internal sealed record RuntimePairingProfile(string Endpoint, string OwnerId, string PairingId, string Origin, string BridgeId, DateTimeOffset ExpiresAt, string ProtectedCredential)
{
    private const string ProfileName = "desktop-runtime-pairing.json";

    internal static RuntimePairingProfile? TryLoad()
    {
        try
        {
            var path = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Seraphim", "Runtime", ProfileName);
            if (!File.Exists(path)) return null;
            using var document = JsonDocument.Parse(File.ReadAllText(path));
            var root = document.RootElement;
            var endpoint = RequiredString(root, "endpoint");
            var ownerId = RequiredString(root, "owner_id");
            var pairingId = RequiredString(root, "pairing_id");
            var origin = RequiredString(root, "origin");
            var bridgeId = RequiredString(root, "bridge_id");
            var expiresAt = RequiredString(root, "expires_at");
            var protectedCredential = RequiredString(root, "credential_protected");
            if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri) ||
                endpointUri.Scheme != Uri.UriSchemeHttp || endpointUri.Host != IPAddress.Loopback.ToString() ||
                endpointUri.Port != 8765 || endpointUri.AbsolutePath != "/" || origin != RequiredOrigin ||
                pairingId.Length != 32 || !pairingId.All(static item => Uri.IsHexDigit(item) && !char.IsUpper(item)) ||
                !HeaderValueIsSafe(ownerId) || !HeaderValueIsSafe(bridgeId) ||
                !DateTimeOffset.TryParse(expiresAt, out var expiry) || expiry <= DateTimeOffset.UtcNow)
            {
                return null;
            }
            return new RuntimePairingProfile(endpoint, ownerId, pairingId, origin, bridgeId, expiry, protectedCredential);
        }
        catch (IOException)
        {
            return null;
        }
        catch (UnauthorizedAccessException)
        {
            return null;
        }
        catch (JsonException)
        {
            return null;
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }

    private static string RequiredString(JsonElement root, string name)
    {
        return root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(value.GetString())
            ? value.GetString()!
            : throw new InvalidOperationException($"Runtime pairing profile {name} is missing.");
    }

    private static bool HeaderValueIsSafe(string value) =>
        value.Length is > 0 and <= 256 && !value.Contains('\r') && !value.Contains('\n');
}

internal static class Dpapi
{
    [StructLayout(LayoutKind.Sequential)]
    private struct DataBlob
    {
        internal int Count;
        internal IntPtr Data;
    }

    [DllImport("crypt32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CryptUnprotectData(ref DataBlob input, IntPtr description, IntPtr entropy, IntPtr reserved, IntPtr prompt, int flags, out DataBlob output);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr LocalFree(IntPtr value);

    internal static bool TryUnprotect(string protectedValue, out byte[] plaintext)
    {
        plaintext = Array.Empty<byte>();
        try
        {
            var encoded = protectedValue.Replace('-', '+').Replace('_', '/');
            encoded = encoded.PadRight(encoded.Length + ((4 - encoded.Length % 4) % 4), '=');
            var ciphertext = Convert.FromBase64String(encoded);
            var inputPointer = Marshal.AllocHGlobal(ciphertext.Length);
            Marshal.Copy(ciphertext, 0, inputPointer, ciphertext.Length);
            var input = new DataBlob { Count = ciphertext.Length, Data = inputPointer };
            try
            {
                if (!CryptUnprotectData(ref input, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, 0x1, out var output)) return false;
                try
                {
                    plaintext = new byte[output.Count];
                    Marshal.Copy(output.Data, plaintext, 0, output.Count);
                    return true;
                }
                finally
                {
                    if (output.Data != IntPtr.Zero) LocalFree(output.Data);
                }
            }
            finally
            {
                Marshal.FreeHGlobal(inputPointer);
                CryptographicOperations.ZeroMemory(ciphertext);
            }
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
