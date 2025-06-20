
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCursos, useTurmas } from '@/hooks/useCursos';
import { RegistrationFormData } from '@/types/registration';

interface VCCUFieldsProps {
  formData: RegistrationFormData;
  setFormData: (data: RegistrationFormData) => void;
}

const VCCUFields = ({ formData, setFormData }: VCCUFieldsProps) => {
  const { cursos } = useCursos();
  const { turmas } = useTurmas(formData.cursoId);

  return (
    <>
      <div>
        <Label htmlFor="curso">Curso *</Label>
        <Select value={formData.cursoId} onValueChange={(value) => setFormData({...formData, cursoId: value, turmaId: ''})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione seu curso" />
          </SelectTrigger>
          <SelectContent>
            {cursos.map((curso) => (
              <SelectItem key={curso.id} value={curso.id}>
                {curso.nome_curso}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">Campo obrigatório para alunos da VCCU</p>
      </div>

      <div>
        <Label htmlFor="turma">Turma *</Label>
        <Select 
          value={formData.turmaId} 
          onValueChange={(value) => setFormData({...formData, turmaId: value})}
          disabled={!formData.cursoId}
        >
          <SelectTrigger>
            <SelectValue placeholder={formData.cursoId ? "Selecione sua turma" : "Primeiro selecione um curso"} />
          </SelectTrigger>
          <SelectContent>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.id}>
                {turma.nome_turma}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">Campo obrigatório para alunos da VCCU</p>
      </div>
    </>
  );
};

export default VCCUFields;
