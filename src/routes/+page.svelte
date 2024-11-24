<script lang="ts">
	import { onMount } from 'svelte';

	let tracking = false;
	let distance = 0;
	let positions: GeolocationPosition[] = [];
	let watchId: number;
	let error: string | null = null;
	let permissionStatus: string | null = null;

	// Convert kilometers to miles
	function kmToMiles(km: number): number {
		return km * 0.621371;
	}

	async function checkLocationPermission() {
		try {
			if (navigator.permissions && navigator.permissions.query) {
				const result = await navigator.permissions.query({ name: 'geolocation' });
				permissionStatus = result.state;

				result.addEventListener('change', () => {
					permissionStatus = result.state;
				});
			}
		} catch (err) {
			console.log('Permissions API not supported');
		}
	}

	function getPermissionInstructions(): string {
		if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
			return "To enable location tracking on iOS:\n1. Go to Settings\n2. Scroll down to Safari\n3. Tap 'Location'\n4. Select 'Allow' for this website";
		} else if (/Android/.test(navigator.userAgent)) {
			return 'To enable location tracking on Android:\n1. Open browser settings\n2. Go to Site settings > Location\n3. Enable location access for this website';
		}
		return 'Please enable location services in your browser settings for this website';
	}

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

	async function startTracking() {
		if (!navigator.geolocation) {
			error = 'Geolocation is not supported by your browser';
			return;
		}

		try {
			await new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 5000
				});
			});

			watchId = navigator.geolocation.watchPosition(
				(position) => {
					error = null;
					updateDistance(position);
				},
				(err) => {
					if (err.code === 1) {
						error = `Location permission denied.\n\n${getPermissionInstructions()}`;
					} else if (err.code === 2) {
						error =
							'Unable to determine your location. Please check if location services are enabled.';
					} else if (err.code === 3) {
						error = 'Location request timed out. Please try again.';
					} else {
						error = `Error: ${err.message}`;
					}
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				}
			);
			tracking = true;
		} catch (err) {
			if (err instanceof GeolocationPositionError) {
				if (err.code === 1) {
					error = `Location permission denied.\n\n${getPermissionInstructions()}`;
				} else {
					error = `Error starting tracking: ${err.message}`;
				}
			} else {
				error = `Error starting tracking: ${err}`;
			}
		}
	}

	function stopTracking() {
		if (watchId) {
			navigator.geolocation.clearWatch(watchId);
			tracking = false;
		}
	}

	onMount(() => {
		checkLocationPermission();
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
		<div
			class="mb-4 whitespace-pre-line rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
		>
			{error}
		</div>
	{/if}

	<div class="mb-4 space-y-2">
		<p class="text-xl">
			Distance: {(distance / 1000).toFixed(2)} km
		</p>
		<p class="text-xl">
			Distance: {kmToMiles(distance / 1000).toFixed(2)} miles
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
