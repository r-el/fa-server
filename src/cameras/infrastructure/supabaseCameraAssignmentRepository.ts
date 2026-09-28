import { injectable } from "tsyringe";
import { getSupabaseClient } from "@core/db/supabase.js";
import { CameraAssignmentRepository } from "@cameras/domain/cameraRepository.js";
import { ICameraAssignment } from "~types/interfaces.js";

// See docs/db/supabase/camera_assignments_table.sql in the fa repository.
const TABLE = "camera_assignments";

interface AssignmentRow {
  id: string;
  specter_camera_id: string;
  user_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

function toAssignment(row: AssignmentRow): ICameraAssignment {
  return {
    id: row.id,
    camera_id: row.specter_camera_id,
    user_id: row.user_id,
    assigned_by: row.assigned_by ?? undefined,
    assigned_at: row.assigned_at,
  };
}

@injectable()
export class SupabaseCameraAssignmentRepository implements CameraAssignmentRepository {
  private get table() {
    return getSupabaseClient().from(TABLE);
  }

  async findCameraIdsAssignedTo(userId: string): Promise<string[]> {
    const { data, error } = await this.table.select("specter_camera_id").eq("user_id", userId);
    if (error) throw new Error(`Failed to read camera assignments: ${error.message}`);
    return data.map((row) => row.specter_camera_id);
  }

  async isAssigned(cameraId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.table
      .select("id")
      .eq("specter_camera_id", cameraId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`Failed to check camera assignment: ${error.message}`);
    return Boolean(data);
  }

  async assign(assignment: ICameraAssignment): Promise<ICameraAssignment> {
    const { data, error } = await this.table
      .insert({
        specter_camera_id: assignment.camera_id,
        user_id: assignment.user_id,
        assigned_by: assignment.assigned_by,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to assign camera: ${error.message}`);
    return toAssignment(data);
  }

  async remove(cameraId: string, userId: string): Promise<void> {
    const { error } = await this.table
      .delete()
      .eq("specter_camera_id", cameraId)
      .eq("user_id", userId);
    if (error) throw new Error(`Failed to remove camera assignment: ${error.message}`);
  }

  async removeAllForCamera(cameraId: string): Promise<void> {
    const { error } = await this.table.delete().eq("specter_camera_id", cameraId);
    if (error) throw new Error(`Failed to remove camera assignments: ${error.message}`);
  }

  async listForCamera(cameraId: string): Promise<ICameraAssignment[]> {
    const { data, error } = await this.table.select("*").eq("specter_camera_id", cameraId);
    if (error) throw new Error(`Failed to read camera assignments: ${error.message}`);
    return data.map(toAssignment);
  }
}
