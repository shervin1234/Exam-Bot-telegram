import { permissions } from "../config/permissions";

type Role = "admin" | "member" | "all";

class AccessControl {
  private permissions: Record<Role, Record<string, boolean>>;

  constructor() {
    this.permissions = permissions;
  }

  public hasAccess(role: Role, commandName: string): boolean {
    if (this.permissions[role]?.[commandName] !== undefined) {
      return this.permissions[role][commandName];
    }

    if (this.permissions[role]?.["*"] !== undefined) {
      return this.permissions[role]["*"];
    }
    return false;
  }
}

export const accessControl = new AccessControl();