const fs = require('fs');

function patchCourseLibrary() {
  let s = fs.readFileSync('src/components/CourseLibrary.tsx', 'utf8');
  if (!s.includes('useSearchParams')) {
    s = s.replace(
      "import { useNavigation } from '../contexts/NavigationContext';",
      "import { useSearchParams } from 'react-router-dom';\nimport { useNavigation } from '../contexts/NavigationContext';"
    );
    s = s.replace(
      "  const { navigate } = useNavigation();\n  const { user } = useAuth();\n  const [courses, setCourses] = useState<Course[]>([]);\n  const [isLoading, setIsLoading] = useState(true);\n  const [query, setQuery] = useState('');",
      "  const { navigate } = useNavigation();\n  const { user } = useAuth();\n  const [searchParams, setSearchParams] = useSearchParams();\n  const [courses, setCourses] = useState<Course[]>([]);\n  const [isLoading, setIsLoading] = useState(true);\n  const [query, setQuery] = useState(searchParams.get('q') || '');"
    );
    s = s.replace(
      "  useEffect(() => {\n    const fetchCourses = async () => {",
      "  useEffect(() => {\n    setQuery(searchParams.get('q') || '');\n  }, [searchParams]);\n\n  useEffect(() => {\n    const fetchCourses = async () => {"
    );
    s = s.replace(
      'onChange={(e) => setQuery(e.target.value)}',
      `onChange={(e) => {
                  const value = e.target.value;
                  setQuery(value);
                  const next = value.trim();
                  if (next) setSearchParams({ q: next }, { replace: true });
                  else setSearchParams({}, { replace: true });
                }}`
    );
  }
  s = s.replace(/text-3xl md:text-4xl font-bold tracking-tight text-ink uppercase font-display leading-tight/g, 'text-3xl md:text-4xl font-bold tracking-tight text-ink font-display leading-tight');
  s = s.replace(/text-xl font-bold tracking-tight uppercase text-ink leading-tight font-display/g, 'text-xl font-bold tracking-tight text-ink leading-tight font-display');
  s = s.replace(/没有找到匹配的课程。/g, '暂无课程');
  fs.writeFileSync('src/components/CourseLibrary.tsx', s);
  console.log('CourseLibrary');
}

function patchAdminCourses() {
  let s = fs.readFileSync('src/components/admin/AdminCoursesPage.tsx', 'utf8');
  if (!s.includes('useSearchParams')) {
    s = s.replace(
      "import { useNavigate } from 'react-router-dom';",
      "import { useNavigate, useSearchParams } from 'react-router-dom';"
    );
    s = s.replace(
      "import { Trash2 } from 'lucide-react';",
      "import { Trash2, Search } from 'lucide-react';"
    );
    s = s.replace(
      "  const navigate = useNavigate();\n  const [courses, setCourses] = useState<Course[]>([]);\n  const [isLoading, setIsLoading] = useState(true);\n  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);",
      "  const navigate = useNavigate();\n  const [searchParams, setSearchParams] = useSearchParams();\n  const [courses, setCourses] = useState<Course[]>([]);\n  const [isLoading, setIsLoading] = useState(true);\n  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);\n  const [query, setQuery] = useState(searchParams.get('q') || '');"
    );
    s = s.replace(
      "  useEffect(() => {\n    const fetchCourses = async () => {",
      "  useEffect(() => {\n    setQuery(searchParams.get('q') || '');\n  }, [searchParams]);\n\n  const filteredCourses = courses.filter((course) => {\n    const keyword = query.trim().toLowerCase();\n    if (!keyword) return true;\n    return [course.title, course.instructor, course.category, course.level]\n      .filter(Boolean)\n      .some((value) => String(value).toLowerCase().includes(keyword));\n  });\n\n  useEffect(() => {\n    const fetchCourses = async () => {"
    );
    s = s.replace(
      '        />\n\n        {isLoading ? (',
      `        />

        <div className="flex items-center gap-3 bg-surface border border-outline rounded-2xl px-5 py-3 max-w-md">
          <Search className="w-4 h-4 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              const next = value.trim();
              if (next) setSearchParams({ q: next }, { replace: true });
              else setSearchParams({}, { replace: true });
            }}
            placeholder="搜索课程..."
            className="w-full bg-transparent outline-none text-sm font-medium text-ink placeholder:text-ink-muted"
          />
        </div>

        {isLoading ? (`
    );
    s = s.replace(/\{courses\.map\(\(course\) =>/g, '{filteredCourses.map((course) =>');
    s = s.replace(/\{!courses\.length &&/g, '{!filteredCourses.length &&');
  }
  s = s.replace(/text-sm font-bold uppercase text-ink-muted/g, 'text-sm font-bold text-ink-muted');
  s = s.replace(/当前还没有课程[。.]?/g, '暂无课程');
  s = s.replace(/当前没有课程，先创建第一门课程。/g, '暂无课程');
  fs.writeFileSync('src/components/admin/AdminCoursesPage.tsx', s);
  console.log('AdminCoursesPage');
}

function patchAssignments() {
  let s = fs.readFileSync('src/components/Assignments.tsx', 'utf8');
  s = s.replace(/\s*<span className="text-\[10px\] font-bold text-ink-muted uppercase tracking-widest">\s*\{assignment\.id\}\s*<\/span>/g, '');
  s = s.replace(/text-2xl font-bold tracking-tight text-ink leading-tight font-display uppercase/g, 'text-2xl font-bold tracking-tight text-ink leading-tight font-display');
  s = s.replace(/text-2xl font-bold tracking-tight leading-tight font-display text-ink uppercase/g, 'text-2xl font-bold tracking-tight leading-tight font-display text-ink');
  s = s.replace(/当前还没有可查看的提交文件/g, '暂无文件');
  fs.writeFileSync('src/components/Assignments.tsx', s);
  console.log('Assignments');
}

function stripTitleUppercase(file) {
  let s = fs.readFileSync(file, 'utf8');
  // broader replacements for Chinese display titles
  s = s.replace(/uppercase tracking-tight font-display/g, 'tracking-tight font-display');
  s = s.replace(/tracking-tight font-display uppercase/g, 'tracking-tight font-display');
  s = s.replace(/font-display tracking-tight uppercase/g, 'font-display tracking-tight');
  s = s.replace(/font-display font-bold tracking-tight uppercase/g, 'font-display font-bold tracking-tight');
  s = s.replace(/tracking-tight uppercase leading-\[0\.94\] text-ink/g, 'tracking-tight leading-[0.94] text-ink');
  s = s.replace(/font-display tracking-tight uppercase leading-tight break-words/g, 'font-display tracking-tight leading-tight break-words');
  s = s.replace(/当前还没有直播安排|当前还没有待开始的直播。|还没有直播安排。/g, '暂无直播');
  s = s.replace(/当前没有作业安排。|暂无作业数据/g, '暂无作业');
  s = s.replace(/暂无课程数据|当前还没有可继续学习的课程。?/g, '暂无课程');
  s = s.replace(/当前资料中心还没有可访问内容。|没有找到匹配的资料。?/g, '暂无资料');
  fs.writeFileSync(file, s);
  console.log('titles', file);
}

function patchAdminEmpty(file) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/当前还没有课程，请先创建课程。/g, '暂无课程');
  s = s.replace(/当前没有课程，先创建第一门课程。/g, '暂无课程');
  s = s.replace(/当前没有作业，点击上方按钮创建。/g, '暂无作业');
  s = s.replace(/当前还没有学生提交作业。/g, '暂无提交');
  s = s.replace(/当前筛选条件下没有提交记录。/g, '暂无提交');
  s = s.replace(/当前还没有学生数据。/g, '暂无学生');
  s = s.replace(/没有找到匹配的学生。/g, '暂无学生');
  s = s.replace(/当前还没有直播安排。?/g, '暂无直播');
  s = s.replace(/当前没有直播安排，点击上方按钮创建。/g, '暂无直播');
  s = s.replace(/当前还没有章节，请先添加课程章节。/g, '暂无章节');
  s = s.replace(/text-base font-bold uppercase tracking-tight font-display text-ink/g, 'text-base font-bold tracking-tight font-display text-ink');
  s = s.replace(/text-lg font-bold uppercase tracking-tight font-display text-ink/g, 'text-lg font-bold tracking-tight font-display text-ink');
  s = s.replace(/text-sm font-bold uppercase text-ink-muted/g, 'text-sm font-bold text-ink-muted');
  s = s.replace(/uppercase tracking-tight font-display/g, 'tracking-tight font-display');
  fs.writeFileSync(file, s);
  console.log('admin', file);
}

patchCourseLibrary();
patchAdminCourses();
patchAssignments();
[
  'src/components/Dashboard.tsx',
  'src/components/LiveStream.tsx',
  'src/components/LessonView.tsx',
  'src/components/Resources.tsx',
  'src/components/admin/AdminHomePage.tsx',
  'src/components/admin/AdminLivePage.tsx',
  'src/components/admin/AdminCourseEditorPage.tsx',
  'src/components/CourseLibrary.tsx',
  'src/components/Assignments.tsx',
].forEach(stripTitleUppercase);
[
  'src/components/admin/AdminCoursesPage.tsx',
  'src/components/admin/AdminAssignmentsPage.tsx',
  'src/components/admin/AdminStudentsPage.tsx',
  'src/components/admin/AdminLivePage.tsx',
  'src/components/admin/AdminHomePage.tsx',
  'src/components/admin/AdminCourseEditorPage.tsx',
].forEach(patchAdminEmpty);

let shared = fs.readFileSync('src/components/admin/shared.tsx', 'utf8');
shared = shared.replace(
  'text-[10px] font-bold text-primary uppercase tracking-[0.2em]',
  'text-[10px] font-bold text-primary tracking-widest'
);
fs.writeFileSync('src/components/admin/shared.tsx', shared);
console.log('done');
