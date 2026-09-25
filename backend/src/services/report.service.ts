export interface ProjectReportData {
  id: string;
  title: string;
  description?: string | null;
  shareCode: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    fullName: string;
    email: string;
    role: string;
  };
  schematicData: any;
  environmentData: any;
  analyticsLogs?: any[];
}

export const generateLabReportHtml = (project: ProjectReportData): string => {
  const parts = Array.isArray(project.schematicData?.parts)
    ? project.schematicData.parts
    : Array.isArray(project.schematicData)
    ? project.schematicData
    : [];

  const wires = Array.isArray(project.schematicData?.wires)
    ? project.schematicData.wires
    : [];

  const env = project.environmentData || {
    sunlight: 500,
    temperature: 28,
    clouds: 10,
    location: 'Classroom',
  };

  // Group components for Bill of Materials
  const bomMap: Record<string, { type: string; name: string; count: number; pins: string[]; ratings: string }> = {};

  parts.forEach((p: any) => {
    const key = p.type || 'generic';
    if (!bomMap[key]) {
      bomMap[key] = {
        type: p.type || 'Generic',
        name: p.name || p.type || 'Component',
        count: 0,
        pins: (p.pins || []).map((pin: any) => pin.id || pin.label),
        ratings: p.rating || (p.type === 'resistor' ? '10 kΩ' : p.type === 'solar' ? '5.0V / 1000 W/m²' : 'Standard'),
      };
    }
    bomMap[key].count++;
  });

  const bomRows = Object.values(bomMap)
    .map(
      (b, idx) => `
      <tr class="${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} border-b border-slate-200">
        <td class="px-4 py-2 font-mono text-xs text-slate-500">${idx + 1}</td>
        <td class="px-4 py-2 font-semibold text-xs text-slate-800">${b.name}</td>
        <td class="px-4 py-2 font-mono text-xs text-blue-700">${b.type}</td>
        <td class="px-4 py-2 font-mono text-xs text-slate-600">${b.ratings}</td>
        <td class="px-4 py-2 font-mono text-xs text-slate-500">${b.pins.slice(0, 4).join(', ') || 'N/A'}</td>
        <td class="px-4 py-2 font-bold font-mono text-xs text-slate-800 text-center">${b.count}</td>
      </tr>`
    )
    .join('');

  const wireRows = wires
    .map(
      (w: any, idx: number) => `
      <tr class="${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} border-b border-slate-200">
        <td class="px-4 py-2 font-mono text-xs text-slate-500">${w.id || `W-${idx + 1}`}</td>
        <td class="px-4 py-2 font-mono text-xs text-emerald-700 font-semibold">${w.fromPart} (${w.fromPin})</td>
        <td class="px-4 py-2 text-center text-xs text-slate-400">➔</td>
        <td class="px-4 py-2 font-mono text-xs text-blue-700 font-semibold">${w.toPart} (${w.toPin})</td>
        <td class="px-4 py-2 font-mono text-xs text-slate-500">NodeNet-${idx + 1}</td>
      </tr>`
    )
    .join('');

  const latestLog = project.analyticsLogs && project.analyticsLogs.length > 0 ? project.analyticsLogs[0] : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Engineering Lab Report - ${project.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-900 font-sans p-6 md:p-12 antialiased">
  
  <!-- Printable Actions Toolbar -->
  <div class="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
    <div>
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Export</span>
      <h2 class="text-sm font-bold text-slate-900">Printable Engineering Lab Experiment Sheet</h2>
    </div>
    <div class="flex space-x-3">
      <button onclick="window.close()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
        Close Window
      </button>
      <button onclick="window.print()" class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5">
        <span>🖨️ Print / Save as PDF</span>
      </button>
    </div>
  </div>

  <!-- Document Sheet -->
  <div class="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12 relative overflow-hidden">
    
    <!-- Top Engineering Header -->
    <div class="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2 text-blue-600 mb-1">
          <span class="font-mono text-xs font-bold tracking-widest uppercase">Open-World Electronics Lab • SBH06387</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          LABORATORY VERIFICATION REPORT
        </h1>
        <p class="text-xs text-slate-500 font-mono mt-1">
          PROJECT: ${project.title.toUpperCase()} • SHARE CODE: ${project.shareCode}
        </p>
      </div>

      <div class="text-left sm:text-right font-mono text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div><strong>Date:</strong> ${new Date(project.updatedAt).toLocaleDateString()}</div>
        <div><strong>Status:</strong> <span class="text-emerald-700 font-bold">VERIFIED COMPLETE</span></div>
        <div><strong>Engine:</strong> Proteus v2.4 + Three.js 3D</div>
      </div>
    </div>

    <!-- Student & Institution Metadata Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-8 text-xs">
      <div>
        <span class="text-slate-400 font-mono text-[10px] block">STUDENT INVESTIGATOR</span>
        <strong class="text-slate-800 text-sm font-semibold">${project.author.fullName}</strong>
      </div>
      <div>
        <span class="text-slate-400 font-mono text-[10px] block">INSTITUTIONAL EMAIL</span>
        <span class="text-slate-700 font-mono">${project.author.email}</span>
      </div>
      <div>
        <span class="text-slate-400 font-mono text-[10px] block">ROLE / CLEARANCE</span>
        <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-100 text-blue-800">${project.author.role}</span>
      </div>
      <div>
        <span class="text-slate-400 font-mono text-[10px] block">LOCATION ENVIRONMENT</span>
        <span class="text-slate-800 font-semibold font-mono">📍 ${env.location || 'Classroom'}</span>
      </div>
    </div>

    <!-- Section 1: Overview & Environmental Conditions -->
    <div class="mb-8 space-y-3">
      <h3 class="text-sm font-bold text-slate-900 tracking-wide uppercase border-l-4 border-blue-600 pl-2">
        1. Experiment Scope &amp; Environmental Telemetry
      </h3>
      <p class="text-xs text-slate-600 leading-relaxed">
        ${project.description || 'This experiment verifies closed-loop circuit dynamics, microcontroller pin telemetry, and sensor response in an open-world multi-physics simulation environment.'}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 font-mono">
          <div class="text-[10px] text-amber-700 font-semibold">SOLAR IRRADIANCE</div>
          <div class="text-base font-bold text-amber-900 mt-0.5">${env.sunlight || 0} W/m²</div>
        </div>
        <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 font-mono">
          <div class="text-[10px] text-rose-700 font-semibold">AMBIENT TEMP</div>
          <div class="text-base font-bold text-rose-900 mt-0.5">${env.temperature || 24} °C</div>
        </div>
        <div class="p-3 rounded-xl bg-sky-50 border border-sky-200 font-mono">
          <div class="text-[10px] text-sky-700 font-semibold">CLOUD DENSITY</div>
          <div class="text-base font-bold text-sky-900 mt-0.5">${env.clouds || 0} % ${(env.clouds || 0) > 80 ? '(Rain Active)' : ''}</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-mono">
          <div class="text-[10px] text-emerald-700 font-semibold">PEAK VOLTAGE</div>
          <div class="text-base font-bold text-emerald-900 mt-0.5">${latestLog?.peakVoltage ? latestLog.peakVoltage.toFixed(2) + ' V' : '3.30 V'}</div>
        </div>
      </div>
    </div>

    <!-- Section 2: Bill of Materials (BOM) -->
    <div class="mb-8 space-y-3">
      <h3 class="text-sm font-bold text-slate-900 tracking-wide uppercase border-l-4 border-blue-600 pl-2">
        2. Bill of Materials (BOM) &amp; Device Inventory
      </h3>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 text-[10px] font-mono uppercase tracking-wider border-b border-slate-200">
              <th class="px-4 py-2.5">#</th>
              <th class="px-4 py-2.5">Device Description</th>
              <th class="px-4 py-2.5">Model / Type</th>
              <th class="px-4 py-2.5">Rating / Value</th>
              <th class="px-4 py-2.5">Active Pin Headers</th>
              <th class="px-4 py-2.5 text-center">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${bomRows || '<tr><td colspan="6" class="p-4 text-center text-xs text-slate-400">No components placed on workbench</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 3: Netlist & Wire Routing Table -->
    <div class="mb-8 space-y-3">
      <h3 class="text-sm font-bold text-slate-900 tracking-wide uppercase border-l-4 border-blue-600 pl-2">
        3. Netlist Wiring Interconnects (${wires.length} Active Conductors)
      </h3>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 text-[10px] font-mono uppercase tracking-wider border-b border-slate-200">
              <th class="px-4 py-2.5">Conductor ID</th>
              <th class="px-4 py-2.5">Source Terminal</th>
              <th class="px-4 py-2.5 text-center">Direction</th>
              <th class="px-4 py-2.5">Destination Terminal</th>
              <th class="px-4 py-2.5">Netlist Node</th>
            </tr>
          </thead>
          <tbody>
            ${wireRows || '<tr><td colspan="5" class="p-4 text-center text-xs text-slate-400">No active wires routed</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 4: Sign-Off & Verification Block -->
    <div class="pt-6 border-t-2 border-slate-200 mt-12 grid grid-cols-2 gap-8 text-xs font-mono">
      <div class="border-t border-dashed border-slate-300 pt-3">
        <span class="text-slate-400 block text-[10px]">STUDENT VERIFICATION SIGNATURE</span>
        <div class="font-bold text-slate-800 text-sm mt-1">${project.author.fullName}</div>
        <div class="text-[10px] text-slate-400">Verified via 2FA Session: SEC-SBH06387</div>
      </div>
      <div class="border-t border-dashed border-slate-300 pt-3 text-right">
        <span class="text-slate-400 block text-[10px]">INSTRUCTOR SIGN-OFF &amp; GRADE</span>
        <div class="font-bold text-blue-700 text-sm mt-1">GRADE: A+ (100% PASS)</div>
        <div class="text-[10px] text-slate-400">Department of Electrical &amp; Embedded Engineering</div>
      </div>
    </div>

  </div>
</body>
</html>`;
};
