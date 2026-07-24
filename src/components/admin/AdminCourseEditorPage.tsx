import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import { apiService, CoursePayload } from '../../services/apiService';
import { LessonModule } from '../../types';
import { AdminLoadingCard, AdminPageHero, EmptyState, FormField, UploadField } from './shared';

interface CourseFormState {
  title: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  description: string;
  image: string;
  videoUrl: string;
  pdfUrl: string;
  modules: Array<{
    id?: string;
    title: string;
    duration?: string;
    videoUrl?: string;
  }>;
}

const createEmptyCourseForm = (): CourseFormState => ({
  title: '',
  instructor: '课程导师',
  category: '基础课程',
  level: 'Core',
  duration: '6h',
  price: 0,
  description: '',
  image: '',
  videoUrl: '',
  pdfUrl: '',
  modules: [],
});

function mapModulesForForm(modules?: LessonModule[]) {
  return Array.isArray(modules)
    ? modules.map((module) => ({
        id: module.id,
        title: module.title || '',
        duration: module.duration || '',
        videoUrl: module.videoUrl || '',
      }))
    : [];
}

function normalizeCourseLevel(level?: string) {
  const value = String(level || '').trim().toLowerCase();
  if (['core', 'starter', 'basic', '入门', '基础'].includes(value)) return 'Core';
  if (['advanced', '进阶'].includes(value)) return 'Advanced';
  if (['mastery', 'master', '高阶', '精通'].includes(value)) return 'Mastery';
  if (['elite', 'certification', '认证', '职业认证'].includes(value)) return 'Elite';
  return 'Core';
}

function createCoursePayload(form: CourseFormState): CoursePayload {
  return {
    title: form.title.trim(),
    instructor: form.instructor.trim() || '课程导师',
    category: form.category.trim() || '基础课程',
    level: normalizeCourseLevel(form.level),
    duration: form.duration.trim(),
    price: Number.isFinite(form.price) ? form.price : 0,
    description: form.description.trim(),
    image: form.image.trim(),
    videoUrl: form.videoUrl.trim(),
    pdfUrl: form.pdfUrl.trim(),
    modules: form.modules
      .map((module, index) => ({
        id: module.id || `lesson-${index + 1}`,
        title: module.title.trim(),
        duration: module.duration?.trim() || '',
        videoUrl: module.videoUrl?.trim() || '',
      }))
      .filter((module) => module.title),
  };
}

export default function AdminCourseEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [form, setForm] = useState<CourseFormState>(createEmptyCourseForm());
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !courseId) return;

    const fetchCourse = async () => {
      try {
        const response = await apiService.getCourses();
        const courses = Array.isArray(response.data) ? response.data : [];
        const currentCourse = courses.find((course) => course.id === courseId);

        if (!currentCourse) {
          toast.error('没有找到对应课程');
          navigate('/admin/courses');
          return;
        }

        setForm({
          title: currentCourse.title || '',
          instructor: currentCourse.instructor || '课程导师',
          category: currentCourse.category || '基础课程',
          level: normalizeCourseLevel(currentCourse.level),
          duration: currentCourse.duration || '6h',
          price: currentCourse.price || 0,
          description: currentCourse.description || '',
          image: currentCourse.image || '',
          videoUrl: currentCourse.videoUrl || '',
          pdfUrl: currentCourse.pdfUrl || '',
          modules: mapModulesForForm(currentCourse.modules),
        });
      } catch (error) {
        toast.error('获取课程详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, mode, navigate]);

  const updateField = <K extends keyof CourseFormState>(field: K, value: CourseFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addModule = () => {
    setForm((current) => ({
      ...current,
      modules: [...current.modules, { title: '', duration: '', videoUrl: '' }],
    }));
  };

  const updateModule = (index: number, key: 'title' | 'duration' | 'videoUrl', value: string) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.map((module, moduleIndex) => (
        moduleIndex === index ? { ...module, [key]: value } : module
      )),
    }));
  };

  const removeModule = (index: number) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.filter((_, moduleIndex) => moduleIndex !== index),
    }));
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiService.uploadImage(formData);
      updateField('image', response.data.url);
      toast.success('课程封面上传成功');
    } catch (error) {
      toast.error('课程封面上传失败');
    }
  };

  const handleVideoUpload = async (file?: File | null, moduleIndex?: number) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiService.uploadVideo(formData);
      if (typeof moduleIndex === 'number') {
        updateModule(moduleIndex, 'videoUrl', response.data.url);
        toast.success('章节视频上传成功');
      } else {
        updateField('videoUrl', response.data.url);
        toast.success('课程视频上传成功');
      }
    } catch (error) {
      toast.error('视频上传失败');
    }
  };

  const handlePdfUpload = async (file?: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiService.uploadImage(formData);
      updateField('pdfUrl', response.data.url);
      toast.success('课件上传成功');
    } catch (error) {
      toast.error('课件上传失败');
    }
  };

  const handleSave = async () => {
    const trimmedTitle = form.title.trim();
    const preparedModules = form.modules
      .map((module) => ({ ...module, title: module.title.trim() }))
      .filter((module) => module.title);

    if (!trimmedTitle) {
      toast.error('请先填写课程标题');
      return;
    }

    if (!form.instructor.trim()) {
      toast.error('请先填写讲师名称');
      return;
    }

    if (!form.level.trim()) {
      toast.error('请先选择课程等级');
      return;
    }

    if (form.price < 0) {
      toast.error('课程价格不能小于 0');
      return;
    }

    const payload = createCoursePayload({
      ...form,
      title: trimmedTitle,
      modules: preparedModules,
    });

    setIsSaving(true);
    try {
      if (mode === 'edit' && courseId) {
        await apiService.updateCourse(courseId, payload);
        toast.success('课程已更新');
      } else {
        await apiService.createCourse(payload);
        toast.success('课程已创建');
      }
      navigate('/admin/courses');
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.response?.data?.message || '保存课程失败';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <AdminLoadingCard label="正在加载课程详情..." />;
  }

  return (
    <div className="min-h-screen bg-app px-6 md:px-10 py-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <AdminPageHero
          eyebrow={mode === 'edit' ? '编辑课程' : '新建课程'}
          title={mode === 'edit' ? '编辑课程结构与资源' : '创建新的课程'}
          primary={{ label: '返回课程管理', action: () => navigate('/admin/courses') }}
          secondary={{ label: '查看后台首页', action: () => navigate('/admin') }}
        />

        <div className="space-y-6">
          <div className="bg-surface border border-outline rounded-[18px] p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="课程标题">
                <input value={form.title} onChange={(e) => updateField('title', e.target.value)} className="admin-input" placeholder="输入课程标题" />
              </FormField>
              <FormField label="讲师名称">
                <input value={form.instructor} onChange={(e) => updateField('instructor', e.target.value)} className="admin-input" placeholder="输入讲师名称" />
              </FormField>
            </div>

            <FormField label="课程简介">
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className="admin-input min-h-[120px] resize-none" placeholder="输入课程简介" />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormField label="分类">
                <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className="admin-input" placeholder="如：基础课程 / 导师培训" />
              </FormField>
              <FormField label="内容层级">
                <select value={form.level} onChange={(e) => updateField('level', e.target.value)} className="admin-input">
                  <option value="Core">核心</option>
                  <option value="Advanced">进阶</option>
                  <option value="Mastery">精通</option>
                  <option value="Elite">认证</option>
                </select>
              </FormField>
              <FormField label="课程时长">
                <input value={form.duration} onChange={(e) => updateField('duration', e.target.value)} className="admin-input" placeholder="如：6h" />
              </FormField>
              <FormField label="价格">
                <input type="number" value={form.price} onChange={(e) => updateField('price', Number(e.target.value))} className="admin-input" placeholder="0" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UploadField label="课程封面" value={form.image} onFileChange={(file) => handleImageUpload(file)} />
              <UploadField label="课程视频" value={form.videoUrl} onFileChange={(file) => handleVideoUpload(file)} accept="video/*" />
              <UploadField label="课件 PDF" value={form.pdfUrl} onFileChange={(file) => handlePdfUpload(file)} accept=".pdf" />
            </div>
          </div>

          <div className="bg-surface border border-outline rounded-[18px] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight font-display text-ink">章节配置</h2>
                <p className="text-sm text-ink-muted font-medium">建立课程模块，供学生端学习页按章节展示。</p>
              </div>
              <Button onClick={addModule} variant="secondary" className="rounded-full px-6">
                <Plus className="w-4 h-4 mr-2" />
                添加章节
              </Button>
            </div>

            <div className="space-y-4">
              {form.modules.map((module, index) => (
                <div key={`${module.id || 'module'}-${index}`} className="rounded-[18px] border border-outline bg-surface-alt p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">章节 {index + 1}</p>
                    <button onClick={() => removeModule(index)} className="text-ink-muted hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input value={module.title} onChange={(e) => updateModule(index, 'title', e.target.value)} className="admin-input" placeholder="章节标题" />
                    <input value={module.duration || ''} onChange={(e) => updateModule(index, 'duration', e.target.value)} className="admin-input" placeholder="如：15:00" />
                    <div className="flex gap-3">
                      <input value={module.videoUrl || ''} onChange={(e) => updateModule(index, 'videoUrl', e.target.value)} className="admin-input flex-1" placeholder="章节视频地址" />
                      <label className="w-12 h-12 rounded-full border border-outline bg-surface hover:bg-surface-alt transition-colors flex items-center justify-center cursor-pointer shrink-0">
                        <Upload className="w-4 h-4 text-ink-muted" />
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(e.target.files?.[0], index)} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {!form.modules.length && <EmptyState text="暂无章节" />}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={() => navigate('/admin/courses')} variant="secondary" className="rounded-full px-8">
              取消
            </Button>
            <Button onClick={handleSave} variant="primary" className="rounded-full px-8" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? '保存中...' : '保存课程'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
