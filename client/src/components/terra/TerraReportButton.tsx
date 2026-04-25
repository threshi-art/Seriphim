type TerraReportButtonProps = {
  onGenerate: () => Promise<string>;
};

export default function TerraReportButton({ onGenerate }: TerraReportButtonProps) {
  return (
    <button
      type="button"
      onClick={async () => {
        const markdown = await onGenerate();
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `argus-terra-report-${Date.now()}.md`;
        anchor.click();
        URL.revokeObjectURL(url);
      }}
      className="w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
    >
      Export Terra Report (Markdown)
    </button>
  );
}
