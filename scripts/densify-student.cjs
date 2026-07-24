const fs = require('fs');

function densifyAssignments() {
  let s = fs.readFileSync('src/components/Assignments.tsx', 'utf8');
  s = s.replace(
    '<div className="edu-hero p-6 sm:p-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">',
    '<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">'
  );
  s = s.replace(
    '<div className="space-y-4 max-w-3xl">\n            <div className="space-y-2"><p className="edu-kicker">作业中心</p><h1 className="edu-title">我的作业</h1></div>\n          </div>',
    '<div><h1 className="edu-title">我的作业</h1></div>'
  );
  s = s.replace(
    'grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto',
    'grid grid-cols-3 gap-2 w-full xl:w-auto'
  );
  s = s.replace(/edu-card p-4 flex items-center gap-4/g, 'edu-stat flex items-center gap-3');
  s = s.replace(/w-10 h-10 rounded-full/g, 'w-8 h-8 rounded-full');
  s = s.replace(/text-2xl font-semibold tracking-tight text-ink/g, 'text-[20px] font-semibold tracking-tight text-ink');
  s = s.replace('grid grid-cols-1 gap-4', 'grid grid-cols-1 gap-2');
  s = s.replace(
    'edu-card p-5 sm:p-6 transition-all hover:border-primary/15',
    'edu-card p-3.5 transition-all hover:border-primary/15'
  );
  s = s.replace(
    'flex flex-col xl:flex-row xl:items-center justify-between gap-8',
    'flex flex-col xl:flex-row xl:items-center justify-between gap-3'
  );
  s = s.replace('flex items-start gap-5', 'flex items-start gap-3');
  s = s.replace(
    'w-12 h-12 rounded-full flex items-center justify-center border',
    'w-9 h-9 rounded-full flex items-center justify-center border shrink-0'
  );
  s = s.replace('space-y-3', 'space-y-1.5');
  s = s.replace(
    'text-lg sm:text-xl font-semibold tracking-tight text-ink',
    'text-[14px] sm:text-[15px] font-semibold tracking-tight text-ink'
  );
  s = s.replace(
    'text-2xl font-semibold tracking-tight text-ink leading-tight font-display',
    'text-[14px] sm:text-[15px] font-semibold tracking-tight text-ink leading-snug'
  );
  s = s.replace('flex flex-wrap gap-5 text-xs font-medium text-ink-muted', 'flex flex-wrap gap-3 text-[11px] font-medium text-ink-muted');
  s = s.replace('flex items-center gap-6 flex-wrap justify-end', 'flex items-center gap-3 flex-wrap justify-end');
  s = s.replace('flex flex-col items-end gap-4 min-w-[180px]', 'flex flex-col items-end gap-2 min-w-[140px]');
  s = s.replace('mt-6 p-5 bg-surface-alt rounded-[18px]', 'mt-3 p-3 bg-surface-alt rounded-[12px]');
  s = s.replace('<div className="edu-card p-6">\n          <div className="flex flex-wrap gap-3">', '<div className="flex flex-wrap gap-2">');
  // fix potential unclosed if we removed outer card - check later
  fs.writeFileSync('src/components/Assignments.tsx', s);
  console.log('Assignments densified');
}

function densifyLive() {
  let s = fs.readFileSync('src/components/LiveStream.tsx', 'utf8');
  s = s.replace(
    '<div className="edu-hero p-6 sm:p-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">',
    '<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">'
  );
  s = s.replace(
    '<div className="space-y-2"><p className="edu-kicker">直播中心</p><h1 className="edu-title">直播与回放</h1></div>',
    '<div><h1 className="edu-title">直播与回放</h1></div>'
  );
  s = s.replace(/edu-card p-4 flex items-center gap-4/g, 'edu-stat flex items-center gap-3');
  s = s.replace(/space-y-8 sm:space-y-10/g, 'space-y-4');
  s = s.replace(/gap-6/g, 'gap-3');
  s = s.replace(/p-8 space-y-5/g, 'p-4 space-y-3');
  s = s.replace(/p-8 space-y-6/g, 'p-4 space-y-3');
  s = s.replace(/edu-card-soft p-5/g, 'edu-card-soft p-3.5');
  s = s.replace(/text-lg font-semibold tracking-tight text-ink/g, 'text-[14px] font-semibold tracking-tight text-ink');
  s = s.replace(/text-2xl sm:text-3xl font-semibold tracking-tight font-display leading-tight/g, 'text-[18px] sm:text-[20px] font-semibold tracking-tight font-display leading-snug');
  fs.writeFileSync('src/components/LiveStream.tsx', s);
  console.log('Live densified');
}

function densifyResources() {
  let s = fs.readFileSync('src/components/Resources.tsx', 'utf8');
  s = s.replace(
    '<div className="space-y-2"><p className="edu-kicker">资料中心</p><h1 className="edu-title">学习资料</h1></div>',
    '<div><h1 className="edu-title">学习资料</h1></div>'
  );
  s = s.replace('edu-card px-4 py-3', 'edu-card px-3 py-2');
  s = s.replace(/edu-card p-4/g, 'edu-stat');
  s = s.replace(/p-5 flex flex-col gap-5 edu-card/g, 'p-3.5 flex flex-col gap-3 edu-card');
  s = s.replace(/w-12 h-12/g, 'w-9 h-9');
  s = s.replace(/text-lg font-display tracking-tight leading-snug/g, 'text-[14px] font-display tracking-tight leading-snug');
  s = s.replace(/font-semibold text-ink text-lg font-display tracking-tight leading-snug break-words/g, 'font-semibold text-ink text-[14px] font-display tracking-tight leading-snug break-words');
  fs.writeFileSync('src/components/Resources.tsx', s);
  console.log('Resources densified');
}

function densifyProfile() {
  let s = fs.readFileSync('src/components/Profile.tsx', 'utf8');
  s = s.replace(/p-8 md:p-10/g, 'p-4 sm:p-5');
  s = s.replace(/p-8 space-y-6/g, 'p-4 space-y-3');
  s = s.replace(/p-8 space-y-5/g, 'p-4 space-y-3');
  s = s.replace(/p-8 space-y-4/g, 'p-4 space-y-3');
  s = s.replace(/space-y-6/g, 'space-y-3');
  s = s.replace(/gap-6/g, 'gap-3');
  s = s.replace(/p-5 space-y-3/g, 'p-3.5 space-y-2');
  fs.writeFileSync('src/components/Profile.tsx', s);
  console.log('Profile densified');
}

densifyAssignments();
densifyLive();
densifyResources();
densifyProfile();
console.log('done');
