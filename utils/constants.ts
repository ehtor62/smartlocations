// Search radius in meters - reduced for better performance
// Get search radius in meters from km value (slider)
export function getSearchRadiusMeters(km: number) {
	return Math.round(km * 1000);
}
