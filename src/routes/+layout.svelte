<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { page } from '$app/stores';
	import { setLocale, locales, getLocale } from '$paraglide/runtime';

	let { children } = $props();

	$effect(() => {
		const lang = $page.url.searchParams.get('lang');
		if (lang && locales.includes(lang as any)) {
			if (getLocale() !== lang) {
				setLocale(lang as any);
			}
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="fixed top-4 right-4 z-50">
	<LanguageSwitcher />
</div>

{@render children()}
<Footer />
