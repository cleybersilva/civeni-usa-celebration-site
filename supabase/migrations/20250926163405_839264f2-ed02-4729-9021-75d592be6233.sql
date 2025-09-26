-- Inserir dados iniciais dos membros do comitê existentes na tabela congresso_comite

INSERT INTO congresso_comite (nome, cargo_pt, instituicao, categoria, foto_url, ordem) VALUES
-- Coordenação Geral (organizador)
('Profa. Dra. Marcela Tarciana Martins', 'Reitora de Relações Acadêmicas', 'VCCU', 'organizador', '/src/assets/marcela-martins.png', 1),
('Profa. Dra. Maria Emilia Camargo', 'Reitora de Relações Internacionais', 'VCCU', 'organizador', '/src/assets/maria-emilia-camargo.png', 2),

-- Comitê Científico
('Profa. Dra. Ana Célia Querino', '', 'VCCU', 'cientifico', '', 3),
('Prof. Dr. Eloy Lemos Júnior', '', 'VCCU', 'cientifico', '', 4),
('Profa. Dra. Esra Sipahi Döngül', '', 'Akasaray University, Faculty of Health Sciences', 'cientifico', '', 5),
('Prof. Dr. Aprigio Telles Mascarenhas Neto', '', 'Faculdade de Direito 8 de Julho', 'cientifico', '', 6),
('Profa. Dra. Marta Elisete Ventura da Motta', '', 'FASOL', 'cientifico', '', 7),
('Prof. Dr. Henrique Rodrigues Lelis', '', 'VCCU', 'cientifico', '', 8),
('Prof. Dr. Mhardoquel Geraldo Lima França', '', 'VCCU', 'cientifico', '', 9),
('Profa. Dra. Mariane Camargo Priesnitz', '', 'VCCU', 'cientifico', '', 10),
('Profa. Dra. Margarete Luiza Alburgeri', '', 'UAL - Portugal', 'cientifico', '', 11),
('Prof. Dr. Walter Priesnitz Filho', '', 'CTISM – UFSM, Brasil', 'cientifico', '', 12),
('Prof. Dr. Ricardo Oliveira', '', 'UFS, Brasil', 'cientifico', '', 13),
('Prof. Dr. Ramon Olímpio de Oliveira', '', 'VCCU', 'cientifico', '', 14),
('Profa. Dra. Vivianne de Sousa', '', 'VCCU', 'cientifico', '', 15),
('Profa. Dra. Gabriela Marcolino', '', 'VCCU', 'cientifico', '', 16),

-- Comitê Operacional (apoio_tecnico)
('Profa. Eliete Francisca da Silva Farias', '', 'VCCU', 'apoio_tecnico', '', 17),
('Gabriely Cristina Queiroga Diniz', '', 'VCCU', 'apoio_tecnico', '', 18),
('Cleyber Gomes da Silva', '', 'VCCU', 'apoio_tecnico', '/src/assets/cleyber-gomes.jpg', 19);