import type { BuildingFormInput } from "@/lib/schemas/buildingFormSchemas";
import type { BuildingDTO, CreateBuildingCommand, UpdateBuildingCommand } from "@/types";

/**
 * Transform BuildingFormInput to CreateBuildingCommand/UpdateBuildingCommand
 * Converts longitude/latitude to GeoJSON Point format
 */
export function transformFormToCommand(formData: BuildingFormInput): CreateBuildingCommand | UpdateBuildingCommand {
  return {
    voivodeship_code: formData.voivodeship_code,
    district_code: formData.district_code,
    community_code: formData.community_code,
    city_code: formData.city_code,
    city_district_code: formData.city_district_code || undefined,
    street_code: formData.street_code || undefined,
    building_number: formData.building_number,
    post_code: formData.post_code,
    location: {
      type: "Point",
      coordinates: [formData.longitude, formData.latitude],
    },
    provider_id: formData.provider_id,
  };
}

/**
 * Transform BuildingDTO to BuildingFormInput for editing
 * Converts GeoJSON Point to longitude/latitude fields
 */
export function transformBuildingToForm(building: BuildingDTO): BuildingFormInput {
  return {
    voivodeship_code: building.voivodeship_code,
    district_code: building.district_code,
    community_code: building.community_code,
    city_code: building.city_code,
    city_district_code: building.city_district_code || "",
    street_code: building.street_code || "",
    building_number: building.building_number,
    post_code: building.post_code || "",
    longitude: building.longitude ?? 0,
    latitude: building.latitude ?? 0,
    provider_id: building.provider_id,
  };
}
