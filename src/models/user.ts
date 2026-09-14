/**
 * User Model
 * Simple data model for user entities.
 */

export interface UserData {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  updated_at?: string;
  created_at?: string;
  role?: string;
}

/**
 * Simple user data model.
 */
export default class User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  updated_at?: string;
  created_at?: string;
  role: string;

  constructor(data: UserData) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.name = data.name;
    this.email = data.email;
    this.updated_at = data.updated_at;
    this.created_at = data.created_at;
    this.role = data.role || "viewer";
  }
}