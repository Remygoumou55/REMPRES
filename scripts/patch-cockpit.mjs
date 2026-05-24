import fs from "fs";

const p = "components/dashboard/super-admin-cockpit/SuperAdminCockpitClient.tsx";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  /<header className="rounded-card[\s\S]*?<\/header>/,
  `<DashboardBanner
        greeting={greeting}
        firstName={firstName}
        date={frenchDate}
        time={clock}
        subtitle="Cockpit central"
        platformOk={platformOk}
        priorityCount={criticalNotes}
      />`,
);

s = s.replace(
  /<section aria-labelledby="kpi-heading" className="space-y-3">[\s\S]*?<\/section>\s*\n\s*<section className="space-y-3" aria-labelledby="charts-heading">/,
  `<section aria-labelledby="kpi-heading" className="space-y-3">
        <SectionLabel label="KPI globaux" rightSlot="Mois en cours · ventes agrégées ERP" />
        <div id="kpi-heading" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard title="Revenus du mois" value={fmtMoney("revenue", revenueMonth)} subtitle="Ventes enregistrées" icon={TrendingUp} color="green" trend={{ label: trendRevenue.label, direction: trendRevenue.up ? "up" : "down" }} />
          <KpiCard title="Ventes du mois" value={metrics.salesCountMonth} subtitle={\`CA net : \${fmtMoney("salesMonth", metrics.revenueMonth)}\`} icon={ShoppingCart} color="blue" trend={{ label: trendSalesCount.label, direction: trendSalesCount.up ? "up" : "down" }} />
          <KpiCard title="Dépenses du mois" value={fmtMoney("expenses", expensesMonth)} subtitle="Dépenses enregistrées" icon={BarChart3} color="orange" />
          <KpiCard title="Bénéfice net" value={fmtMoney("margin", marginMonth)} subtitle="Revenus − dépenses" icon={Activity} color={marginMonth < 0 ? "red" : "purple"} />
          <KpiCard title="Employés actifs" value={activeContracts} subtitle="Contrats actifs RH" icon={Users} color="blue" isEmpty={activeContracts === 0} />
          <KpiCard title="Formations en cours" value={metrics.formationActive ?? 0} icon={GraduationCap} color="purple" isEmpty={metrics.formationEmpty} />
          <KpiCard title="Campagnes marketing" value={metrics.marketingActive ?? 0} icon={Megaphone} color="pink" isEmpty={metrics.marketingEmpty} />
          <KpiCard title="Produits sous seuil" value={stockCritical} subtitle={kpis.productsOutOfStock > 0 ? \`\${kpis.productsOutOfStock} rupture(s), \${kpis.productsLowStock} faible(s)\` : "Seuils produits"} icon={Package} color={stockCritical > 0 ? "orange" : "green"} />
          <KpiCard title="En attente de validation" value={metrics.pendingApprovals} subtitle="Approbations gouvernance" icon={ClipboardCheck} color={metrics.pendingApprovals > 0 ? "orange" : "green"} />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="charts-heading">`,
);

s = s.replace(
  /<ActivityTimeline events=\{kpis\.recentActivity\} \/>/,
  '<ActivityFeed items={accueil.activities} viewAllHref="/admin/activity-logs" />',
);

s = s.replace(
  /<SalesChart data=\{kpis\.salesLast7Days\} \/>/,
  "{metrics.salesLast7Days.length === 0 ? <EmptyChart /> : <SalesChart data={metrics.salesLast7Days} />}",
);

s = s.replace(
  /<PlatformTrendLine data=\{kpis\.salesLast7Days\} \/>/,
  '{metrics.salesLast7Days.length === 0 ? <EmptyChart message="Courbe disponible dès les premières ventes" /> : <PlatformTrendLine data={metrics.salesLast7Days} />}',
);

s = s.replace(
  /<motion.div className="card space-y-2 p-4 sm:p-5 lg:col-span-2">[\s\S]*?<DomainMixChart data=\{domainMix\} valueLabel="Valeur" \/>[\s\S]*?<\/motion.div>/,
  `{showDomainMix ? (
          <div className="card space-y-2 p-4 sm:p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-darktext">Activité / charge par département</p>
              <Activity size={16} className="shrink-0 text-primary" />
            </div>
            <DomainMixChart data={domainMix} valueLabel="Valeur" />
          </div>
        ) : null}`,
);

s = s.replace(/import \{ CockpitMetricCard \} from "\.\/CockpitMetricCard";\n/, "");
s = s.replace(/  Bell,\n/, "");
s = s.replace(/  Gauge,\n/, "");
s = s.replace(/  normalizeSpark,\n/, "");
s = s.replace(/  healthBadge,\n  normalizeSpark,\n  splitWindowTrendFromDays,\n/, "  healthBadge,\n  splitWindowTrendFromDays,\n");
s = s.replace(/  const sparkRevenue = useMemo\([\s\S]*?\);\n\n/, "");

fs.writeFileSync(p, s);
console.log("patched cockpit");
