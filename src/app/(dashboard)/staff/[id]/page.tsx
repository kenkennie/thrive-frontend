"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useStaffList,
  useDeactivateStaff,
  useReactivateStaff,
  useResetPassword,
} from "@/features/staff/hooks/useStaff";
import { InviteForm } from "@/features/staff/components/inviteForm";
import { usePermission } from "@/hooks/usePermission";
import { Pagination } from "@/components/ui/Pagination";
import { getInitials, formatDate, cn } from "@/lib/utils";
import {
  Plus,
  Search,
  X,
  UserCheck,
  UserX,
  KeyRound,
  ChevronRight,
  Shield,
  MoreVertical,
  Mail,
} from "lucide-react";

const LIMIT = 20;

export default function StaffPage() {
  const router = useRouter();
  const canInvite = usePermission("staff:invite");
  const canDeactivate = usePermission("staff:deactivate");
  const canReset = usePermission("staff:reset_password");

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showInvite, setShowInvite] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data, isLoading } = useStaffList({
    search: search || undefined,
    isActive: active,
    page,
    limit: LIMIT,
  });

  const staffList = data?.data ?? [];
  const meta = data?.meta;

  const deactivate = useDeactivateStaff();
  const reactivate = useReactivateStaff();
  const resetPw = useResetPassword();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search staff…"
            className="h-9 pl-8 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 w-52"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          {[
            { label: "All", value: undefined },
            { label: "Active", value: true },
            { label: "Inactive", value: false },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => {
                setActive(value);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                active === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {meta?.total ?? staffList.length} members
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => router.push("/staff/roles")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            <Shield className="w-4 h-4" />
            Roles
          </button>
          {canInvite && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "var(--brand-gold)",
                color: "var(--brand-navy)",
              }}
            >
              <Plus className="w-4 h-4" />
              Invite Staff
            </button>
          )}
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Invite Staff Member
            </h2>
            <button
              onClick={() => setShowInvite(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <InviteForm onDone={() => setShowInvite(false)} />
        </div>
      )}

      {/* Staff list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-sm text-muted-foreground">
              No staff members found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {staffList.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/20 transition-colors group relative"
              >
                {/* Avatar */}
                <button
                  onClick={() => router.push(`/staff/${member.id}`)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                      !member.isActive && "opacity-50",
                    )}
                    style={{
                      backgroundColor: "var(--brand-gold)",
                      color: "var(--brand-navy)",
                    }}
                  >
                    {getInitials(member.fullName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {member.fullName}
                      </span>
                      {member.isSuperAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                          Super Admin
                        </span>
                      )}
                      {!member.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                      {!member.emailVerifiedAt && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Pending invite
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      {member.userRoles?.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {member.userRoles
                            .map((ur: any) => ur.role.displayName)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Last active */}
                <div className="hidden sm:block text-right shrink-0">
                  {member.lastLoginAt ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Last login
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {formatDate(member.lastLoginAt)}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Never logged in
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === member.id ? null : member.id)
                    }
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen === member.id && (
                    <div className="absolute right-0 top-8 w-44 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden py-1">
                      <button
                        onClick={() => {
                          router.push(`/staff/${member.id}`);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        View profile
                      </button>
                      {canReset && (
                        <button
                          onClick={() => {
                            resetPw.mutate(member.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Reset password
                        </button>
                      )}
                      {canDeactivate &&
                        !member.isSuperAdmin &&
                        (member.isActive ? (
                          <button
                            onClick={() => {
                              if (confirm(`Deactivate ${member.fullName}?`))
                                deactivate.mutate(member.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              reactivate.mutate(member.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Reactivate
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
