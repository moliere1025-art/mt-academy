const fs = require('fs');

function patchAssignments() {
  let s = fs.readFileSync('src/components/Assignments.tsx', 'utf8');
  s = s.replace(
    'min-h-screen bg-app px-6 md:px-10 py-8 flex items-center justify-center',
    'edu-page flex items-center justify-center min-h-[70vh]'
  );
  s = s.replace(
    '<div className="min-h-screen bg-app px-6 md:px-10 py-8">\n      <div className="max-w-[1400px] mx-auto space-y-10 pb-24">',
    '<div className="edu-page">\n      <div className="edu-shell pb-16">'
  );
  s = s.replace(
    '<div className="bg-surface border border-outline rounded-[18px] p-8 md:p-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">',
    '<div className="edu-hero p-6 sm:p-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">'
  );
  s = s.replace(
    '<h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-ink">\n              我的作业\n            </h1>',
    '<div className="space-y-2"><p className="edu-kicker">作业中心</p><h1 className="edu-title">我的作业</h1></div>'
  );
  s = s.replace(
    /rounded-2xl border border-outline bg-surface-alt px-5 py-4 flex items-center gap-4/g,
    'edu-card p-4 flex items-center gap-4'
  );
  s = s.replace(
    /text-\[10px\] font-bold text-ink-muted uppercase tracking-widest mb-1/g,
    'edu-stat-label'
  );
  s = s.replace(
    /text-2xl font-bold tracking-tight text-ink/g,
    'text-2xl font-semibold tracking-tight text-ink'
  );
  s = s.replace(
    /bg-surface border border-outline rounded-\[18px\] p-6 transition-all/g,
    'edu-card p-5 sm:p-6 transition-all hover:border-primary/15'
  );
  s = s.replace(
    /text-2xl font-bold tracking-tight text-ink leading-tight font-display/g,
    'text-lg sm:text-xl font-semibold tracking-tight text-ink'
  );
  s = s.replace(
    /text-\[10px\] font-bold uppercase tracking-widest text-primary bg-primary\/5 px-3 py-1 rounded-full border border-primary\/10/g,
    'edu-chip-blue'
  );
  s = s.replace(
    /text-\[11px\] font-bold text-ink-muted uppercase tracking-widest/g,
    'text-xs font-medium text-ink-muted'
  );
  s = s.replace(
    /px-3 py-1 rounded-full text-\[10px\] font-bold uppercase tracking-widest flex items-center gap-2 border/g,
    'rounded-full text-[12px] font-semibold flex items-center gap-2 border px-3 py-1'
  );
  s = s.replace(
    '<div className="bg-surface border border-outline rounded-[18px] p-8 md:p-10">\n          <div className="flex flex-wrap gap-4">',
    '<div className="edu-card p-6">\n          <div className="flex flex-wrap gap-3">'
  );
  fs.writeFileSync('src/components/Assignments.tsx', s);
  console.log('Assignments');
}

function patchLiveStream() {
  let s = fs.readFileSync('src/components/LiveStream.tsx', 'utf8');
  s = s.replace(
    'min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8 flex items-center justify-center',
    'edu-page flex items-center justify-center min-h-[70vh]'
  );
  s = s.replace(
    '<div className="min-h-screen bg-app px-4 sm:px-6 md:px-10 py-8">\n      <div className="max-w-[1400px] mx-auto space-y-8 sm:space-y-10 pb-24">',
    '<div className="edu-page">\n      <div className="edu-shell pb-16">'
  );
  s = s.replace(
    '<div className="bg-surface border border-outline rounded-[18px] p-5 sm:p-8 md:p-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6 sm:gap-8">',
    '<div className="edu-hero p-6 sm:p-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">'
  );
  s = s.replace(
    '<h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-ink">\n              直播与回放\n            </h1>',
    '<div className="space-y-2"><p className="edu-kicker">直播中心</p><h1 className="edu-title">直播与回放</h1></div>'
  );
  s = s.replace(
    /rounded-2xl border border-outline bg-surface-alt px-4 sm:px-5 py-4 flex items-center gap-4/g,
    'edu-card p-4 flex items-center gap-4'
  );
  s = s.replace(
    /text-\[10px\] font-bold text-ink-muted uppercase tracking-widest mb-1/g,
    'edu-stat-label'
  );
  s = s.replace(/bg-surface border border-outline rounded-\[18px\]/g, 'edu-card');
  s = s.replace(/rounded-\[18px\] border border-outline bg-surface-alt p-6/g, 'edu-card-soft p-5');
  s = s.replace(
    /text-2xl font-bold tracking-tight font-display text-ink/g,
    'edu-section-title'
  );
  s = s.replace(
    /text-xl font-bold tracking-tight font-display leading-tight text-ink/g,
    'text-lg font-semibold tracking-tight text-ink'
  );
  s = s.replace(
    /text-\[10px\] font-bold text-primary uppercase tracking-widest mb-2/g,
    'text-xs font-semibold text-primary mb-2'
  );
  s = s.replace(
    /text-\[11px\] font-bold uppercase tracking-widest text-ink-muted/g,
    'text-xs font-medium text-ink-muted'
  );
  s = s.replace(
    /text-\[11px\] font-bold uppercase tracking-widest text-white\/70/g,
    'text-xs font-medium text-white/70'
  );
  s = s.replace(
    /text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight font-display leading-tight/g,
    'text-2xl sm:text-3xl font-semibold tracking-tight font-display leading-tight'
  );
  s = s.replace(
    'rounded-[18px] border border-dashed border-outline bg-surface p-10 text-center text-ink-muted font-medium',
    'edu-empty'
  );
  fs.writeFileSync('src/components/LiveStream.tsx', s);
  console.log('LiveStream');
}

function patchResources() {
  let s = fs.readFileSync('src/components/Resources.tsx', 'utf8');
  s = s.replace(
    'flex items-center justify-center h-[70vh]',
    'edu-page flex items-center justify-center min-h-[70vh]'
  );
  s = s.replace(
    '<div className="min-h-screen bg-app px-6 md:px-10 py-8 font-sans">\n      <div className="max-w-[1400px] mx-auto space-y-10">',
    '<div className="edu-page">\n      <div className="edu-shell">'
  );
  s = s.replace(
    '<h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-ink">\n              学习资料\n            </h1>',
    '<div className="space-y-2"><p className="edu-kicker">资料中心</p><h1 className="edu-title">学习资料</h1></div>'
  );
  s = s.replace(
    'flex items-center gap-3 bg-surface border border-outline rounded-2xl px-5 py-4',
    'flex items-center gap-3 edu-card px-4 py-3'
  );
  s = s.replace(/bg-surface border border-outline rounded-2xl px-4 py-4/g, 'edu-card p-4');
  s = s.replace(
    /text-\[10px\] font-bold text-ink-muted uppercase tracking-widest mb-2/g,
    'edu-stat-label'
  );
  s = s.replace(
    /text-2xl font-bold tracking-tight text-ink/g,
    'text-2xl font-semibold tracking-tight text-ink'
  );
  s = s.replace(
    /p-6 flex flex-col gap-6 bg-surface border border-outline hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group rounded-\[18px\]/g,
    'p-5 flex flex-col gap-5 edu-card hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 group'
  );
  s = s.replace(
    /text-\[10px\] font-bold uppercase tracking-widest text-blue-600/g,
    'text-xs font-semibold text-primary'
  );
  s = s.replace(
    /font-bold text-ink text-xl font-display tracking-tight leading-tight break-words/g,
    'font-semibold text-ink text-lg font-display tracking-tight leading-snug break-words'
  );
  s = s.replace(
    /text-\[11px\] font-bold text-ink-muted uppercase tracking-widest/g,
    'text-xs font-medium text-ink-muted'
  );
  s = s.replace(
    /w-14 h-14 bg-surface-alt rounded-2xl flex items-center justify-center text-blue-600 border border-outline group-hover:bg-blue-600 group-hover:text-white transition-all duration-300/g,
    'w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary border border-blue-100 group-hover:bg-primary group-hover:text-white transition-all duration-300 dark:bg-blue-500/10 dark:border-blue-500/20'
  );
  fs.writeFileSync('src/components/Resources.tsx', s);
  console.log('Resources');
}

function patchProfile() {
  let s = fs.readFileSync('src/components/Profile.tsx', 'utf8');
  s = s.replace(
    '<div className="min-h-screen bg-app px-6 md:px-10 py-8">\n      <div className="max-w-[1400px] mx-auto space-y-6">',
    '<div className="edu-page">\n      <div className="edu-shell">'
  );
  s = s.replace(/bg-surface border border-outline rounded-\[18px\]/g, 'edu-card');
  s = s.replace(
    /text-2xl md:text-3xl font-display font-bold tracking-tight text-ink/g,
    'edu-title'
  );
  s = s.replace(/text-lg font-bold tracking-tight text-ink/g, 'edu-section-title');
  s = s.replace(/rounded-\[14px\] bg-surface-alt border border-outline/g, 'edu-card-soft');
  s = s.replace(/rounded-\[14px\] border border-outline/g, 'edu-card-soft');
  s = s.replace(
    /text-3xl font-bold tracking-tight text-ink leading-none/g,
    'text-2xl font-semibold tracking-tight text-ink leading-none'
  );
  fs.writeFileSync('src/components/Profile.tsx', s);
  console.log('Profile');
}

function patchLessonView() {
  let s = fs.readFileSync('src/components/LessonView.tsx', 'utf8');
  s = s.replace(
    'flex items-center justify-center h-[70vh]',
    'edu-page flex items-center justify-center min-h-[70vh]'
  );
  s = s.replace(
    '<div className="min-h-screen bg-app px-6 md:px-10 py-8">\n      <div className="max-w-[1400px] mx-auto space-y-8">',
    '<div className="edu-page">\n      <div className="edu-shell space-y-6">'
  );
  s = s.replace(/bg-surface border border-outline rounded-\[18px\]/g, 'edu-card');
  s = s.replace(/rounded-2xl border border-outline bg-surface-alt/g, 'edu-card-soft');
  s = s.replace(
    /text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight text-ink/g,
    'text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight text-ink'
  );
  s = s.replace(
    /text-4xl md:text-5xl font-display font-bold tracking-tight leading-\[0\.94\] text-ink/g,
    'text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight leading-tight text-ink'
  );
  s = s.replace(/text-\[10px\] font-bold uppercase tracking-widest/g, 'text-xs font-semibold');
  s = s.replace(
    /text-xl font-bold tracking-tight font-display text-ink/g,
    'edu-section-title'
  );
  s = s.replace(
    /text-2xl font-bold tracking-tight font-display text-ink/g,
    'edu-section-title'
  );
  s = s.replace(
    'rounded-[18px] border border-dashed border-outline bg-surface-alt p-6 text-sm text-ink-muted font-medium',
    'edu-empty'
  );
  fs.writeFileSync('src/components/LessonView.tsx', s);
  console.log('LessonView');
}

function patchSidebar() {
  let s = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
  s = s.replace(
    "'bg-sidebar-active text-sidebar-ink'",
    "'bg-sidebar-active text-sidebar-ink shadow-sm'"
  );
  s = s.replace(
    'text-[10px] font-bold uppercase tracking-widest text-sidebar-ink-muted px-3 mb-3',
    'text-[11px] font-semibold tracking-wide text-sidebar-ink-muted px-3 mb-3'
  );
  s = s.replace(
    'text-[10px] text-sidebar-ink-muted tracking-wide uppercase mt-0.5',
    'text-[11px] text-sidebar-ink-muted tracking-wide mt-0.5'
  );
  fs.writeFileSync('src/components/Sidebar.tsx', s);
  console.log('Sidebar');
}

function patchTopNav() {
  let s = fs.readFileSync('src/components/TopNav.tsx', 'utf8');
  s = s.replace(
    'hidden sm:flex items-center bg-surface-alt rounded-xl px-4 py-2 w-full max-w-[320px] transition-all focus-within:bg-surface group border border-transparent focus-within:border-outline',
    'hidden sm:flex items-center bg-surface-alt/80 rounded-full px-4 py-2 w-full max-w-[320px] transition-all focus-within:bg-surface group border border-outline/70 focus-within:border-primary/30'
  );
  s = s.replace(
    'hidden sm:flex items-center bg-primary/5 px-3 py-1 rounded-full border border-primary/10',
    'hidden sm:flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'
  );
  fs.writeFileSync('src/components/TopNav.tsx', s);
  console.log('TopNav');
}

function patchFooter() {
  let s = fs.readFileSync('src/components/Footer.tsx', 'utf8');
  s = s.replace(
    'text-[12px] font-medium text-[#0066cc] hover:underline inline-flex items-center gap-1',
    'text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1'
  );
  fs.writeFileSync('src/components/Footer.tsx', s);
  console.log('Footer');
}

patchAssignments();
patchLiveStream();
patchResources();
patchProfile();
patchLessonView();
patchSidebar();
patchTopNav();
patchFooter();
console.log('done');
