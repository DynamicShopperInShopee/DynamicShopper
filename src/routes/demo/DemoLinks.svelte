<script lang="ts">
	import { resolve } from '$app/paths';

	const demos = [
		{ name: 'playwright', href: resolve('/demo/playwright') },
		{ name: 'better-auth', href: resolve('/demo/better-auth') }
	];
</script>

<!--
	@component
	Lists the add-on demos in `/demo/<add-on>`. Added by `sv add`.

	To remove: delete `<DemoLinks />` and its import, then `demo/DemoLinks.svelte`.
-->

<div
	class="sv-demo-links fixed right-5 bottom-5 z-[9999] max-w-64 min-w-44 -rotate-[1.5deg] bg-[linear-gradient(to_bottom,#fff9b0,#fff176)] px-[1.125rem] pt-4 pb-3.5 text-left text-[#3d3500] shadow-[0_1px_2px_rgb(0_0_0/0.15),0_10px_24px_-6px_rgb(0_0_0/0.35)] [font:14px/1.5_system-ui,sans-serif]"
>
	<p class="m-0 font-bold tracking-[0.02em]">sv addon demos</p>

	<ul class="mx-0 mt-2 mb-0 list-none p-0">
		{#each demos as demo (demo.href)}
			<li class="px-0 py-0.5">
				<a
					class="text-[#1a4fd6] underline underline-offset-2 visited:text-[#6b6420] hover:text-[#0b2f8a]"
					href={demo.href}
				>
					{demo.name}
				</a>
			</li>
		{/each}
	</ul>

	<a
		class="home mt-2 block border-t border-dashed border-[rgb(61_53_0/0.3)] pt-1.5 text-right text-[12px] text-[#6b6420] underline underline-offset-2 visited:text-[#6b6420] not-visited:hover:text-[#0b2f8a]"
		href={resolve('/')}
	>
		home
	</a>
</div>
