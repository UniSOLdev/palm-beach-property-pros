export default function WebsiteBuilderLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-4 lg:flex-row animate-pulse">
      <div className="h-96 w-full rounded-2xl bg-sky/20 lg:w-[380px]" />
      <div className="min-h-[60vh] flex-1 rounded-2xl bg-sky/30" />
    </div>
  );
}
