import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  Package,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
  Bell,
  ClipboardList,
  MessageSquare,
  type LucideIcon,
  Shield,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission(s) — user needs at least one */
  permissions?: string[];
  /** Feature flag key in ClinicSettings */
  featureFlag?: string;
  badge?: string;
  children?: Omit<NavItem, "icon" | "children">[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        permissions: ["appointments:view", "appointments:view_own"],
        featureFlag: "enableDashboard",
      },
      {
        label: "Appointments",
        href: "/appointments",
        icon: Calendar,
        permissions: ["appointments:view", "appointments:view_own"],
        featureFlag: "enableAppointments",
      },
      {
        label: "Clients",
        href: "/clients",
        icon: Users,
        permissions: ["clients:view"],
        featureFlag: "enableClients",
      },
    ],
  },
  {
    label: "Clinical",
    items: [
      {
        label: "Sessions",
        href: "/clinical/sessions",
        icon: Stethoscope,
        permissions: ["clinical_notes:view", "clinical_notes:create"],
        featureFlag: "enableClinical",
      },
      {
        label: "Treatment Plans",
        href: "/clinical/treatment-plans",
        icon: ClipboardList,
        permissions: ["treatment_plans:create", "treatment_plans:manage"],
        featureFlag: "enableTreatmentPlans",
      },
    ],
  },
  {
    label: "Services",
    items: [
      {
        label: "Services",
        href: "/services",
        icon: Package,
        permissions: ["services:view"],
        featureFlag: "enableServices",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Invoices",
        href: "/invoices",
        icon: FileText,
        permissions: ["invoices:view"],
        featureFlag: "enableInvoices",
      },
      {
        label: "Quotes",
        href: "/quotes",
        icon: Receipt,
        permissions: ["quotes:create", "invoices:view"],
        featureFlag: "enableInvoices",
      },
      {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
        permissions: ["payments:view"],
        featureFlag: "enablePayments",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        permissions: ["reports:view"],
        featureFlag: "enableReports",
      },
      {
        label: "Waitlist",
        href: "/waitlist",
        icon: Users,
        permissions: ["waitlist:view"],
        featureFlag: "enableAppointments",
      },
      {
        label: "Feedback",
        href: "/feedback",
        icon: MessageSquare,
        permissions: ["feedback:view"],
        featureFlag: "enableAppointments",
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        label: "Staff",
        href: "/staff",
        icon: UserCog,
        permissions: ["staff:view"],
        featureFlag: "enableStaff",
      },
      {
        label: "Permissions",
        href: "/permissions",
        icon: Shield,
        permissions: ["permissions:view"],
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        permissions: ["notifications:view"],
        featureFlag: "enableNotifications",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permissions: ["settings:view"],
        featureFlag: "enableSettings",
      },
    ],
  },
];
