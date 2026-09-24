import { ObjectId } from "mongodb";

export interface IUser {
    id?: string;
    username?: string;
    password?: string;
    name?: string;
    email?: string;
    role?: string;
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface ICamera {
    id?: string;
    name: string;
    connection_string: string;
    created_by?: string;
    specter_camera_id?: string | null;
    organization_id?: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface IEvent {
    _id?: ObjectId | string;
    person_id: string;
    camera_id: string;
    level: "low" | "medium" | "high";
    time: Date | string;
    message?: string;
    image_id?: string;
    Processing_time?: number;
}

export interface ICameraAssignment {
    id?: string;
    camera_id: string;  // This is the Supabase UUID (cameras.id), not the old text identifier
    user_id: string;
    assigned_by?: string;
    assigned_at?: Date | string;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
}

export interface IEventQuery extends PaginationQuery {
    level?: string;
    startDate?: string;
    endDate?: string;
    cameraId?: string;
}

export interface ICameraQuery extends PaginationQuery {
    search?: string;
}
