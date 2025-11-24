
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCursos, useTurmas } from '@/hooks/useCursos';
import { RegistrationFormData } from '@/types/registration';
import { getTranslatedCourseName } from '@/utils/courseTranslations';

interface VCCUFieldsProps {
  formData: RegistrationFormData;
  setFormData: (data: RegistrationFormData) => void;
}

const VCCUFields = ({ formData, setFormData }: VCCUFieldsProps) => {
  const { t, i18n } = useTranslation();
  const { cursos } = useCursos();
  const { turmas } = useTurmas(formData.cursoId);

  return (
    <>
      <div>
        <Label htmlFor="curso">{t('registration.course')} *</Label>
        <Select value={formData.cursoId} onValueChange={(value) => setFormData({...formData, cursoId: value, turmaId: ''})}>
          <SelectTrigger>
            <SelectValue placeholder={t('registration.selectCourse')} />
          </SelectTrigger>
                     <SelectContent>
            {cursos.map((curso) => (
              <SelectItem key={curso.id} value={curso.id}>
                {getTranslatedCourseName(curso.nome_curso, i18n.language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">{t('registration.requiredForVccuStudents')}</p>
      </div>

      <div>
        <Label htmlFor="turma">{t('registration.class')} *</Label>
        <Select 
          value={formData.turmaId} 
          onValueChange={(value) => setFormData({...formData, turmaId: value})}
          disabled={!formData.cursoId}
        >
          <SelectTrigger>
            <SelectValue placeholder={formData.cursoId ? t('registration.selectClass') : t('registration.selectCourseFirst')} />
          </SelectTrigger>
          <SelectContent>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.id}>
                {turma.nome_turma}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">{t('registration.requiredForVccuStudents')}</p>
      </div>
    </>
  );
};

export default VCCUFields;
