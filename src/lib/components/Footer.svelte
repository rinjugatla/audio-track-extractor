<script lang="ts">
  export let repo: string = 'https://github.com/rinjugatla/audio-track-extractor';
</script>

<footer class="w-full bg-base-100">
  <div class="container mx-auto max-w-2xl p-4 flex items-center justify-center gap-2 text-sm text-base-content/70">
    <a
      href={repo}
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-2 hover:text-primary"
      aria-label="Open repository on GitHub"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
        <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.9 3.18 9.06 7.6 10.52.56.1.77-.24.77-.53 0-.26-.01-1.12-.02-2.03-3.09.67-3.74-1.49-3.74-1.49-.5-1.27-1.22-1.61-1.22-1.61-.99-.68.08-.67.08-.67 1.09.08 1.66 1.12 1.66 1.12.98 1.67 2.56 1.19 3.18.91.1-.71.38-1.19.69-1.46-2.47-.28-5.07-1.23-5.07-5.47 0-1.21.43-2.2 1.13-2.98-.11-.28-.49-1.41.11-2.95 0 0 .92-.29 3.02 1.13a10.45 10.45 0 0 1 2.75-.37c.93 0 1.87.13 2.75.37 2.09-1.42 3.01-1.13 3.01-1.13.6 1.54.22 2.67.11 2.95.7.78 1.13 1.77 1.13 2.98 0 4.25-2.6 5.18-5.08 5.46.39.34.74 1.02.74 2.06 0 1.49-.01 2.69-.01 3.06 0 .29.2.64.78.53C19.07 20.8 22.25 16.65 22.25 11.75 22.25 5.48 17.27.5 12 .5z" />
      </svg>
      <span>View on GitHub</span>
    </a>
  </div>
</footer>
