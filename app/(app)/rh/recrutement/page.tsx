import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { PageHeader } from "@/components/ui/page-header";
import { assertCanReadRecruitment } from "@/modules/hr/recruitment/server/security/access";
import {
  getRecruitmentCandidateDetails,
  getRecruitmentDomainSnapshot,
} from "@/modules/hr/recruitment/server/services/recruitment-service";
import {
  RecruitmentAdminWorkspace,
  type RecruitmentDetailPack,
} from "@/modules/hr/recruitment/components/RecruitmentAdminWorkspace";
import { RecruitmentRealtimeBridge } from "@/modules/hr/recruitment/components/realtime/RecruitmentRealtimeBridge";

export default async function RHRecruitmentPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await assertCanReadRecruitment(user.id))) redirect("/access-denied");

  const [{ messages }, snapshot] = await Promise.all([
    loadLocaleMessages(getRequestLocale()),
    getRecruitmentDomainSnapshot(),
  ]);
  const t = (key: string, fallback?: string) => translateFromDict(messages, key, fallback);

  const ids = snapshot.candidates.slice(0, 25).map((c) => c.id);
  const detailRows = await Promise.all(ids.map((id) => getRecruitmentCandidateDetails(id)));
  const detailsByCandidateId = ids.reduce<Record<string, RecruitmentDetailPack>>((acc, id, i) => {
    const row = detailRows[i];
    acc[id] = {
      documents: row.documents,
      timeline: row.timeline,
      interviews: row.interviews,
      evaluations: row.evaluations,
      onboarding: row.onboarding,
    };
    return acc;
  }, {});

  return (
    <div className="page-wrapper">
      <RecruitmentRealtimeBridge />
      <PageHeader
        title={t("dashboard.rh.recruitment.title", "Recrutement RH Enterprise")}
        subtitle={t(
          "dashboard.rh.recruitment.subtitle",
          "ATS : candidats, pipeline, entretiens, evaluations, onboarding, gouvernance et exports.",
        )}
      />
      <RecruitmentAdminWorkspace candidates={snapshot.candidates} detailsByCandidateId={detailsByCandidateId} />
    </div>
  );
}
