
export interface Batch {
  id: string;
  batch_number: number;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

export interface Category {
  id: string;
  category_name: string;
  price_brl: number;
  requires_proof: boolean;
  is_exempt: boolean;
}

export interface RegistrationFormData {
  email: string;
  fullName: string;
  participantType: string;
  categoryId: string;
  cursoId: string;
  turmaId: string;
  couponCode: string;
}

export interface NewRegistrationSectionProps {
  registrationType?: 'presencial' | 'online';
}
