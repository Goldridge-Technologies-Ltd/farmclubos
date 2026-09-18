import { ForbiddenException, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PaginatedResult } from "../../common/http/api-response.js";
import { pageWindow } from "../../common/http/pagination-query.dto.js";
import { normalizeEmail } from "../../common/utils/normalize-email.js";
import { slugify } from "../../common/utils/slugify.js";
import type { Institution, Prisma } from "../../generated/prisma/client.js";
import { isUniqueConstraintError } from "../../lib/database/prisma-errors.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import type {
  CreateInstitutionDto,
  InstitutionListQueryDto,
  UpdateInstitutionDto,
} from "./dto/institution-request.dto.js";
import { InstitutionAccessService } from "./institution-access.service.js";
import type { InstitutionView } from "./institutions.types.js";

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: InstitutionAccessService,
  ) {}

  /** Platform admins create institutions, already vetted, so they start ACTIVE. */
  async create(user: AuthenticatedUser, input: CreateInstitutionDto): Promise<InstitutionView> {
    await this.access.assertPlatformAdmin(user);

    const base = slugify(input.name);
    const data = {
      ...input,
      contactEmail: normalizeEmail(input.contactEmail),
      status: "ACTIVE" as const,
    };

    let institution: Institution;

    try {
      institution = await this.prisma.institution.create({
        data: { ...data, slug: await this.nextFreeSlug(base) },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // Another request took the slug between our read and our write.
      institution = await this.prisma.institution.create({
        data: { ...data, slug: `${base}-${randomBytes(3).toString("hex")}` },
      });
    }

    await this.audit(user, institution.id, "institution.created");

    return toInstitutionView(institution);
  }

  async list(
    user: AuthenticatedUser,
    query: InstitutionListQueryDto,
  ): Promise<PaginatedResult<InstitutionView>> {
    await this.access.assertPlatformAdmin(user);

    const where: Prisma.InstitutionWhereInput = {
      archivedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.institution.findMany({
        where,
        orderBy: { name: "asc" },
        ...pageWindow(query),
      }),
      this.prisma.institution.count({ where }),
    ]);

    return PaginatedResult.of(items.map(toInstitutionView), total, query.page, query.pageSize);
  }

  async findOne(user: AuthenticatedUser, institutionId: string): Promise<InstitutionView> {
    const { institution } = await this.access.assertCanView(user, institutionId);

    return toInstitutionView(institution);
  }

  async update(
    user: AuthenticatedUser,
    institutionId: string,
    input: UpdateInstitutionDto,
  ): Promise<InstitutionView> {
    const { isPlatformAdmin } = await this.access.assertCanManage(user, institutionId);

    if (input.type !== undefined && !isPlatformAdmin) {
      throw new ForbiddenException({
        code: "INSUFFICIENT_ROLE",
        message: "Only a platform administrator can change an institution's type.",
      });
    }

    const data = {
      ...input,
      ...(input.contactEmail ? { contactEmail: normalizeEmail(input.contactEmail) } : {}),
    };

    const institution = await this.prisma.institution.update({
      where: { id: institutionId },
      data,
    });

    await this.audit(user, institutionId, "institution.updated", {
      fields: Object.keys(data),
    });

    return toInstitutionView(institution);
  }

  /** `base`, or the first of `base-2`, `base-3`… not already taken. */
  private async nextFreeSlug(base: string): Promise<string> {
    const taken = new Set(
      (
        await this.prisma.institution.findMany({
          where: { slug: { startsWith: base } },
          select: { slug: true },
        })
      ).map(({ slug }) => slug),
    );

    let slug = base;
    for (let suffix = 2; taken.has(slug); suffix += 1) {
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  private async audit(
    user: AuthenticatedUser,
    institutionId: string,
    action: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        institutionId,
        actorUserId: user.userId,
        action,
        entityType: "Institution",
        entityId: institutionId,
        ...(metadata === undefined ? {} : { metadata }),
      },
    });
  }
}

export function toInstitutionView(institution: Institution): InstitutionView {
  return {
    id: institution.id,
    slug: institution.slug,
    name: institution.name,
    type: institution.type,
    status: institution.status,
    contactEmail: institution.contactEmail,
    contactPhone: institution.contactPhone,
    website: institution.website,
    addressLine: institution.addressLine,
    city: institution.city,
    country: institution.country,
    createdAt: institution.createdAt,
    updatedAt: institution.updatedAt,
  };
}
