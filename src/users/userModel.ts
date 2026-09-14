/**
 * User Model
 * Simple data model for user entities
 */

/**
 * @class User
 * @classdesc Simple user data model
 */
import { IUser } from "~types/interfaces.js";

class User implements IUser {
  id?: string;
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  updated_at?: string;
  created_at?: string;
  role?: string;

  constructor(data: IUser) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.name = data.name;
    this.email = data.email;
    this.updated_at = data.updated_at as string;
    this.created_at = data.created_at as string;
    this.role = data.role || "viewer";
  }
}

export default User;
