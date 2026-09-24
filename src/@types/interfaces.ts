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

export type CameraLiveStatus = "starting" | "running" | "reconnecting" | "stopped" | "failed";

/** A Specter camera as fa shows it; Specter keeps it, fa adds who created it and where it is. */
export interface ICamera {
    id: string;
    name: string;
    source_url: string;
    username: string | null;
    has_password: boolean;
    location: string | null;
    created_by: string | null;
    watchlist_ids: string[];
    detection_classes: string[];
    is_enabled: boolean;
    desired_state: "running" | "stopped";
    live_status: CameraLiveStatus | null;
}

export interface ICameraCredentials {
    username: string;
    password: string;
}

export interface ICameraCreate {
    name: string;
    source_url: string;
    credentials: ICameraCredentials | null;
    location: string | null;
    created_by: string;
    watchlist_ids: string[];
    detection_classes: string[];
}

export interface ICameraChanges {
    name?: string;
    source_url?: string;
    // null removes the stored credentials.
    credentials?: ICameraCredentials | null;
    location?: string | null;
    watchlist_ids?: string[];
    detection_classes?: string[];
    is_enabled?: boolean;
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
    camera_id: string;  // The Specter camera id
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
