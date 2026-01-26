// ... after generating the signedData ...

// Use RPC for an atomic increment (safer for concurrent clicks)
const { error: updateError } = await supabase.rpc("increment_download_count", {
  row_id: download.id,
});

// Or sticking to standard update but slightly cleaner:
await supabase
  .from("downloads")
  .update({
    download_count: download.download_count + 1,
    last_downloaded_at: new Date().toISOString(), // Good for tracking
  })
  .eq("id", download.id);
