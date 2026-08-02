# Building SystemSentinel Executable

## Prerequisites

1. **JDK 21 or higher** (required by `pom.xml` and for the `jpackage` tool)
   - Download from: https://adoptium.net/ or https://www.oracle.com/java/
   - Make sure `JAVA_HOME` is set, or `java` and `jpackage` are in your PATH

2. **Maven Wrapper**
   - Use the committed `mvnw.cmd` wrapper.
   - A separate Maven install is optional.

## Quick Build

### Option 1: Automated Script (Recommended)

Run the PowerShell script:

```powershell
.\scripts\build.ps1
```

This will:
1. Build the JAR file with Maven
2. Create a Windows executable using jpackage
3. Output an app image to `target\exe\SystemSentinel\`

### Option 2: Manual Steps

1. **Build the JAR:**
   ```powershell
   .\mvnw.cmd clean package
   ```

2. **Create the executable:**
   ```powershell
   mkdir target\package-input
   copy target\SystemSentinel-1.0.0.jar target\package-input\
   jpackage --input target\package-input --name SystemSentinel --main-jar SystemSentinel-1.0.0.jar --main-class ui.Launcher --type app-image --dest target\exe --app-version 1.0.0 --description "System Sentinel - Local Integrity Console" --vendor "SystemSentinel"
   ```

## Output

The executable will be created in `target\exe\SystemSentinel\SystemSentinel.exe`.

The executable is a self-contained application that includes:
- All Java dependencies
- JavaFX runtime
- Application code
- Bundled runtime for the generated app image

## Running the Application

### From Executable:
Double-click `target\exe\SystemSentinel\SystemSentinel.exe` or run it from PowerShell:

```powershell
.\target\exe\SystemSentinel\SystemSentinel.exe
```

### From JAR (if executable build fails):
```powershell
java -jar target\SystemSentinel-1.0.0.jar
```

## Troubleshooting

### "jpackage not found"
- Ensure you have JDK 21+ installed
- Check that `JAVA_HOME` points to the JDK (not JRE)
- Verify `jpackage.exe` exists in `%JAVA_HOME%\bin\`

### "JAVA_HOME not found"
- Set `JAVA_HOME` to your JDK installation path, or make sure `java.exe` and `jpackage.exe` are on `PATH`.

### "Maven not found"
- Use `.\mvnw.cmd` from the project root.
- If the wrapper cannot download Maven, check network access and retry.

### Scripts not found
- Ensure the `scripts\` directory exists in the project root
- The executable needs access to PowerShell scripts in the `scripts\` folder
- The scripts should be in the same directory as the executable when running

## Notes

- The first build may take several minutes as it downloads dependencies
- The executable size will be large (~100-200MB) as it includes the JRE
- For distribution, you may want to create an installer instead of the current app image.


