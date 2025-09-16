-- Inserir traduções básicas para o evento existente
INSERT INTO event_translations (
  event_id,
  idioma,
  titulo,
  subtitulo,
  descricao_richtext,
  meta_title,
  meta_description
) VALUES (
  (SELECT id FROM events WHERE slug = '3-civeni-usa-2025'),
  'pt-BR',
  '3º CIVENI USA 2025',
  'Congresso Internacional de Veterinária em Enfermidades Neurológicas e Infecciosas nos Estados Unidos',
  '<p>O 3º CIVENI USA representa um marco importante na disseminação do conhecimento veterinário especializado em enfermidades neurológicas e infecciosas. Este congresso internacional reunirá profissionais, pesquisadores e estudantes de veterinária em um ambiente híbrido, proporcionando acesso amplo ao conteúdo de alta qualidade.</p>

<p>Durante o evento, serão apresentadas as mais recentes pesquisas, técnicas diagnósticas e abordagens terapêuticas no campo da medicina veterinária especializada. Os participantes terão a oportunidade de interagir com especialistas renomados e expandir sua rede profissional.</p>

<p><strong>Objetivos do Congresso:</strong></p>
<ul>
<li>Compartilhar conhecimentos atualizados sobre enfermidades neurológicas veterinárias</li>
<li>Discutir avanços no diagnóstico e tratamento de doenças infecciosas</li>
<li>Promover a colaboração internacional entre profissionais</li>
<li>Facilitar o intercâmbio de experiências clínicas e de pesquisa</li>
</ul>',
  '3º CIVENI USA 2025 - Congresso de Veterinária',
  'Participe do 3º CIVENI USA 2025, congresso internacional sobre enfermidades neurológicas e infecciosas em medicina veterinária. Evento híbrido com especialistas renomados.'
),
(
  (SELECT id FROM events WHERE slug = '3-civeni-usa-2025'),
  'en',
  '3rd CIVENI USA 2025',
  'International Congress of Veterinary Medicine on Neurological and Infectious Diseases in the United States',
  '<p>The 3rd CIVENI USA represents an important milestone in disseminating specialized veterinary knowledge on neurological and infectious diseases. This international congress will bring together professionals, researchers, and veterinary students in a hybrid environment, providing broad access to high-quality content.</p>

<p>During the event, the latest research, diagnostic techniques, and therapeutic approaches in specialized veterinary medicine will be presented. Participants will have the opportunity to interact with renowned experts and expand their professional network.</p>

<p><strong>Congress Objectives:</strong></p>
<ul>
<li>Share updated knowledge about veterinary neurological diseases</li>
<li>Discuss advances in diagnosis and treatment of infectious diseases</li>
<li>Promote international collaboration among professionals</li>
<li>Facilitate the exchange of clinical and research experiences</li>
</ul>',
  '3rd CIVENI USA 2025 - Veterinary Congress',
  'Join the 3rd CIVENI USA 2025, international congress on neurological and infectious diseases in veterinary medicine. Hybrid event with renowned specialists.'
),
(
  (SELECT id FROM events WHERE slug = '3-civeni-usa-2025'),
  'es',
  '3º CIVENI USA 2025',
  'Congreso Internacional de Medicina Veterinaria sobre Enfermedades Neurológicas e Infecciosas en Estados Unidos',
  '<p>El 3º CIVENI USA representa un hito importante en la difusión del conocimiento veterinario especializado en enfermedades neurológicas e infecciosas. Este congreso internacional reunirá a profesionales, investigadores y estudiantes de veterinaria en un ambiente híbrido, proporcionando acceso amplio a contenido de alta calidad.</p>

<p>Durante el evento, se presentarán las investigaciones más recientes, técnicas diagnósticas y enfoques terapéuticos en el campo de la medicina veterinaria especializada. Los participantes tendrán la oportunidad de interactuar con expertos reconocidos y expandir su red profesional.</p>

<p><strong>Objetivos del Congreso:</strong></p>
<ul>
<li>Compartir conocimientos actualizados sobre enfermedades neurológicas veterinarias</li>
<li>Discutir avances en el diagnóstico y tratamiento de enfermedades infecciosas</li>
<li>Promover la colaboración internacional entre profesionales</li>
<li>Facilitar el intercambio de experiencias clínicas y de investigación</li>
</ul>',
  '3º CIVENI USA 2025 - Congreso de Veterinaria',
  'Participa en el 3º CIVENI USA 2025, congreso internacional sobre enfermedades neurológicas e infecciosas en medicina veterinaria. Evento híbrido con especialistas reconocidos.'
);