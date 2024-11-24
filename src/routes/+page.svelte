<script lang="ts">
	import { onMount } from 'svelte';

	let tracking = false;
	let distance = 0;
	let positions: GeolocationPosition[] = [];
	let watchId: number;
	let error: string | null = null;

	// Calculate distance between two points using Haversine formula
	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371e3; // Earth's radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c;
	}

	// Update total distance when new position is received
	function updateDistance(position: GeolocationPosition) {
		if (positions.length > 0) {
			const lastPos = positions[positions.length - 1];
			const newDistance = calculateDistance(
				lastPos.coords.latitude,
				lastPos.coords.longitude,
				position.coords.latitude,
				position.coords.longitude
			);
			distance += newDistance;
		}
		positions = [...positions, position];
	}

	// Start tracking
	function startTracking() {
		if (!navigator.geolocation) {
			error = 'Geolocation is not supported by your browser';
			return;
		}

		try {
			watchId = navigator.geolocation.watchPosition(
				(position) => {
					error = null;
					updateDistance(position);
				},
				(err) => {
					error = `Error: ${err.message}`;
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				}
			);
			tracking = true;

			// Register service worker for background tracking
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker
					.register('/service-worker.js')
					.then((registration) => {
						console.log('ServiceWorker registration successful');
					})
					.catch((err) => {
						console.error('ServiceWorker registration failed:', err);
					});
			}
		} catch (err) {
			error = `Error starting tracking: ${err}`;
		}
	}

	// Stop tracking
	function stopTracking() {
		if (watchId) {
			navigator.geolocation.clearWatch(watchId);
			tracking = false;
		}
	}

	// Clean up on unmount
	onMount(() => {
		return () => {
			if (tracking) {
				stopTracking();
			}
		};
	});
</script>

<div class="container p-4">
	<h1 class="mb-4 text-2xl font-bold">Hike Distance Tracker</h1>

	{#if error}
		<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
			{error}
		</div>
	{/if}

	<div class="mb-4">
		<p class="text-xl">
			Distance: {(distance / 1000).toFixed(2)} km
		</p>
	</div>

	<div class="space-x-4">
		{#if !tracking}
			<button
				class="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700"
				on:click={startTracking}
			>
				Start Tracking
			</button>
		{:else}
			<button
				class="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
				on:click={stopTracking}
			>
				Stop Tracking
			</button>
		{/if}
	</div>
</div>
