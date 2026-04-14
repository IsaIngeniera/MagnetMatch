/**
 * Database Seeding Script
 * 
 * This script populates the database with initial data for testing.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { 
  sequelize,
  Empresa, 
  Vacante, 
  Habilidad, 
  VacanteHabilidad,
} = require('../models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    console.log(`Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);

    // =============================================
    // Seed Habilidades (Skills)
    // =============================================
    console.log('\nSeeding habilidades...');
    const habilidades = await Habilidad.bulkCreate([
      // Technical Skills
      { nombre: 'JavaScript', categoria: 'Lenguajes de Programación' },
      { nombre: 'TypeScript', categoria: 'Lenguajes de Programación' },
      { nombre: 'Python', categoria: 'Lenguajes de Programación' },
      { nombre: 'Java', categoria: 'Lenguajes de Programación' },
      { nombre: 'C#', categoria: 'Lenguajes de Programación' },
      { nombre: 'Go', categoria: 'Lenguajes de Programación' },
      { nombre: 'Rust', categoria: 'Lenguajes de Programación' },
      { nombre: 'PHP', categoria: 'Lenguajes de Programación' },
      
      // Frameworks Frontend
      { nombre: 'React', categoria: 'Frameworks Frontend' },
      { nombre: 'Vue.js', categoria: 'Frameworks Frontend' },
      { nombre: 'Angular', categoria: 'Frameworks Frontend' },
      { nombre: 'Next.js', categoria: 'Frameworks Frontend' },
      { nombre: 'Svelte', categoria: 'Frameworks Frontend' },
      
      // Frameworks Backend
      { nombre: 'Node.js', categoria: 'Frameworks Backend' },
      { nombre: 'Express.js', categoria: 'Frameworks Backend' },
      { nombre: 'Django', categoria: 'Frameworks Backend' },
      { nombre: 'Spring Boot', categoria: 'Frameworks Backend' },
      { nombre: 'FastAPI', categoria: 'Frameworks Backend' },
      { nombre: 'NestJS', categoria: 'Frameworks Backend' },
      
      // Databases
      { nombre: 'PostgreSQL', categoria: 'Bases de Datos' },
      { nombre: 'MySQL', categoria: 'Bases de Datos' },
      { nombre: 'MongoDB', categoria: 'Bases de Datos' },
      { nombre: 'Redis', categoria: 'Bases de Datos' },
      { nombre: 'Elasticsearch', categoria: 'Bases de Datos' },
      
      // Cloud & DevOps
      { nombre: 'AWS', categoria: 'Cloud & DevOps' },
      { nombre: 'Azure', categoria: 'Cloud & DevOps' },
      { nombre: 'GCP', categoria: 'Cloud & DevOps' },
      { nombre: 'Docker', categoria: 'Cloud & DevOps' },
      { nombre: 'Kubernetes', categoria: 'Cloud & DevOps' },
      { nombre: 'CI/CD', categoria: 'Cloud & DevOps' },
      
      // Soft Skills
      { nombre: 'Trabajo en equipo', categoria: 'Habilidades Blandas' },
      { nombre: 'Comunicación efectiva', categoria: 'Habilidades Blandas' },
      { nombre: 'Resolución de problemas', categoria: 'Habilidades Blandas' },
      { nombre: 'Liderazgo', categoria: 'Habilidades Blandas' },
      { nombre: 'Gestión del tiempo', categoria: 'Habilidades Blandas' },
      { nombre: 'Metodologías Ágiles', categoria: 'Metodologías' },
      { nombre: 'Scrum', categoria: 'Metodologías' },
    ], { ignoreDuplicates: true });

    console.log(`  Created/found ${habilidades.length} habilidades`);

    // =============================================
    // Seed Empresas (Companies)
    // =============================================
    console.log('\nSeeding empresas...');
    const empresas = await Empresa.bulkCreate([
      { 
        nombre: 'TechCorp Solutions', 
        sector: 'Tecnología', 
        sitio_web: 'https://techcorp.example.com',
        descripcion: 'Empresa líder en desarrollo de software empresarial'
      },
      { 
        nombre: 'DataDriven Inc', 
        sector: 'Análisis de Datos', 
        sitio_web: 'https://datadriven.example.com',
        descripcion: 'Especialistas en Big Data y Machine Learning'
      },
      { 
        nombre: 'CloudFirst Services', 
        sector: 'Cloud Computing', 
        sitio_web: 'https://cloudfirst.example.com',
        descripcion: 'Servicios de migración y gestión de infraestructura cloud'
      },
      { 
        nombre: 'StartupX', 
        sector: 'Fintech', 
        sitio_web: 'https://startupx.example.com',
        descripcion: 'Innovación en servicios financieros digitales'
      },
      { 
        nombre: 'GlobalRetail Systems', 
        sector: 'E-commerce', 
        sitio_web: 'https://globalretail.example.com',
        descripcion: 'Soluciones tecnológicas para comercio electrónico'
      }
    ], { ignoreDuplicates: true });

    console.log(`  Created/found ${empresas.length} empresas`);

    // =============================================
    // Seed Vacantes (Job Postings)
    // =============================================
    console.log('\nSeeding vacantes...');

    const vacantesExistentes = await Vacante.count();
    let vacantes;

    if (vacantesExistentes > 0) {
      console.log(`  Ya existen ${vacantesExistentes} vacantes. Omitiendo creación...`);
      vacantes = await Vacante.findAll({ order: [['id_vacante', 'ASC']] });
    } else {
      vacantes = await Vacante.bulkCreate([
        {
          id_empresa: empresas[0].id_empresa,
          titulo: 'Senior Full Stack Developer',
          descripcion: 'Buscamos desarrollador full stack con experiencia en React y Node.js para liderar proyectos de alta complejidad.',
          salario_min: 80000,
          salario_max: 120000,
          modalidad: 'híbrido',
          activa: true
        },
        {
          id_empresa: empresas[0].id_empresa,
          titulo: 'Junior Frontend Developer',
          descripcion: 'Oportunidad para desarrolladores junior con conocimientos en React o Vue.js.',
          salario_min: 35000,
          salario_max: 50000,
          modalidad: 'remoto',
          activa: true
        },
        {
          id_empresa: empresas[1].id_empresa,
          titulo: 'Data Engineer',
          descripcion: 'Ingeniero de datos para diseñar y mantener pipelines de datos a gran escala.',
          salario_min: 70000,
          salario_max: 100000,
          modalidad: 'híbrido',
          activa: true
        },
        {
          id_empresa: empresas[2].id_empresa,
          titulo: 'DevOps Engineer',
          descripcion: 'Ingeniero DevOps con experiencia en AWS, Docker y Kubernetes.',
          salario_min: 75000,
          salario_max: 110000,
          modalidad: 'remoto',
          activa: true
        },
        {
          id_empresa: empresas[3].id_empresa,
          titulo: 'Backend Developer Python',
          descripcion: 'Desarrollador backend con experiencia en Python, FastAPI o Django.',
          salario_min: 60000,
          salario_max: 90000,
          modalidad: 'presencial',
          activa: true
        },
        {
          id_empresa: empresas[4].id_empresa,
          titulo: 'Tech Lead',
          descripcion: 'Líder técnico para equipo de desarrollo e-commerce. Experiencia en arquitectura de software.',
          salario_min: 100000,
          salario_max: 150000,
          modalidad: 'híbrido',
          activa: true
        }
      ], { ignoreDuplicates: true });

      console.log(`  Created ${vacantes.length} vacantes`);
    }

    // =============================================
    // Seed Vacante Habilidades (Required Skills)
    // =============================================
    console.log('\nSeeding vacante_habilidad relationships...');
    const allHabilidades = await Habilidad.findAll();
    const habMap = {};
    allHabilidades.forEach(h => { habMap[h.nombre] = h.id_habilidad; });

    await VacanteHabilidad.bulkCreate([
      // Senior Full Stack Developer
      { id_vacante: vacantes[0].id_vacante, id_habilidad: habMap['JavaScript'], es_obligatoria: true },
      { id_vacante: vacantes[0].id_vacante, id_habilidad: habMap['TypeScript'], es_obligatoria: true },
      { id_vacante: vacantes[0].id_vacante, id_habilidad: habMap['React'], es_obligatoria: true },
      { id_vacante: vacantes[0].id_vacante, id_habilidad: habMap['Node.js'], es_obligatoria: true },
      { id_vacante: vacantes[0].id_vacante, id_habilidad: habMap['PostgreSQL'], es_obligatoria: false },
      
      // Junior Frontend Developer
      { id_vacante: vacantes[1].id_vacante, id_habilidad: habMap['JavaScript'], es_obligatoria: true },
      { id_vacante: vacantes[1].id_vacante, id_habilidad: habMap['React'], es_obligatoria: false },
      { id_vacante: vacantes[1].id_vacante, id_habilidad: habMap['Vue.js'], es_obligatoria: false },
      
      // Data Engineer
      { id_vacante: vacantes[2].id_vacante, id_habilidad: habMap['Python'], es_obligatoria: true },
      { id_vacante: vacantes[2].id_vacante, id_habilidad: habMap['PostgreSQL'], es_obligatoria: true },
      { id_vacante: vacantes[2].id_vacante, id_habilidad: habMap['AWS'], es_obligatoria: false },
      
      // DevOps Engineer
      { id_vacante: vacantes[3].id_vacante, id_habilidad: habMap['AWS'], es_obligatoria: true },
      { id_vacante: vacantes[3].id_vacante, id_habilidad: habMap['Docker'], es_obligatoria: true },
      { id_vacante: vacantes[3].id_vacante, id_habilidad: habMap['Kubernetes'], es_obligatoria: true },
      { id_vacante: vacantes[3].id_vacante, id_habilidad: habMap['CI/CD'], es_obligatoria: true },
      
      // Backend Developer Python
      { id_vacante: vacantes[4].id_vacante, id_habilidad: habMap['Python'], es_obligatoria: true },
      { id_vacante: vacantes[4].id_vacante, id_habilidad: habMap['FastAPI'], es_obligatoria: false },
      { id_vacante: vacantes[4].id_vacante, id_habilidad: habMap['Django'], es_obligatoria: false },
      { id_vacante: vacantes[4].id_vacante, id_habilidad: habMap['PostgreSQL'], es_obligatoria: true },
      
      // Tech Lead
      { id_vacante: vacantes[5].id_vacante, id_habilidad: habMap['JavaScript'], es_obligatoria: true },
      { id_vacante: vacantes[5].id_vacante, id_habilidad: habMap['Node.js'], es_obligatoria: true },
      { id_vacante: vacantes[5].id_vacante, id_habilidad: habMap['React'], es_obligatoria: true },
      { id_vacante: vacantes[5].id_vacante, id_habilidad: habMap['Liderazgo'], es_obligatoria: true },
      { id_vacante: vacantes[5].id_vacante, id_habilidad: habMap['Metodologías Ágiles'], es_obligatoria: true },
    ], { ignoreDuplicates: true });

    console.log('  Created/found vacante-habilidad relationships');

    console.log('\n========================================');
    console.log('Database seeding completed successfully!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();