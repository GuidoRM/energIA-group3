import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { company } from "@/server/db/schema";

/**
 * Company repository — the only place that knows how `company` rows are read
 * and written. Services depend on this, never on Drizzle directly.
 */
export const companyRepository = {
  findById(id: string) {
    return db.query.company.findFirst({
      where: eq(company.id, id),
      with: { equipment: true },
    });
  },

  listByOrganization(organizationId: string) {
    return db.query.company.findMany({
      where: eq(company.organizationId, organizationId),
    });
  },

  async create(data: typeof company.$inferInsert) {
    const [row] = await db.insert(company).values(data).returning();
    return row;
  },
};
