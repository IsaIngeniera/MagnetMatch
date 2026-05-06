const { Empresa, Vacante, Habilidad, VacanteHabilidad } = require('../models');

const seedData = async () => {
  try {
    console.log('Iniciando semilla de datos...');

    // 1. Habilidades Ficticias
    const habilidadesData = [
      { nombre: 'JavaScript', categoria: 'Desarrollo' },
      { nombre: 'Python', categoria: 'Desarrollo' },
      { nombre: 'React', categoria: 'Desarrollo' },
      { nombre: 'Node.js', categoria: 'Desarrollo' },
      { nombre: 'Bases de Datos SQL', categoria: 'Bases de Datos' },
      { nombre: 'Liderazgo', categoria: 'Blandas' },
      { nombre: 'Comunicación Asertiva', categoria: 'Blandas' },
      { nombre: 'Trabajo en equipo', categoria: 'Blandas' },
      { nombre: 'Gestión de Proyectos', categoria: 'Gestión' },
      { nombre: 'Inglés Avanzado', categoria: 'Idiomas' },
      { nombre: 'Adobe Illustrator', categoria: 'Diseño' },
      { nombre: 'Marketing Digital', categoria: 'Marketing' },
      { nombre: 'Ventas B2B', categoria: 'Ventas' },
      { nombre: 'Atención al Cliente', categoria: 'Servicio' }
    ];

    for (const h of habilidadesData) {
      await Habilidad.findOrCreate({
        where: { nombre: h.nombre },
        defaults: h
      });
    }
    console.log('✅ Habilidades creadas');

    // 2. Empresas Ficticias
    const empresasData = [
      {
        nombre: 'TechGlobal Solutions',
        descripcion: 'Empresa líder en desarrollo de software a nivel mundial.',
        sector: 'Tecnología',
        ubicacion: 'Bogotá'
      },
      {
        nombre: 'InnovaSoft',
        descripcion: 'Startup innovadora enfocada en IA y Machine Learning.',
        sector: 'Inteligencia Artificial',
        ubicacion: 'Medellín'
      },
      {
        nombre: 'Banco Futuro',
        descripcion: 'Entidad financiera con fuerte apuesta por la transformación digital.',
        sector: 'Finanzas',
        ubicacion: 'Remoto'
      },
      {
        nombre: 'Creative Studio 360',
        descripcion: 'Agencia de publicidad y diseño especializada en branding global.',
        sector: 'Publicidad y Diseño',
        ubicacion: 'Bogotá'
      },
      {
        nombre: 'Global Sales Corp',
        descripcion: 'Multinacional dedicada a la comercialización de productos de consumo masivo.',
        sector: 'Comercio',
        ubicacion: 'Cali'
      }
    ];

    const empresasDb = [];
    for (const e of empresasData) {
      const [empresa] = await Empresa.findOrCreate({
        where: { nombre: e.nombre },
        defaults: e
      });
      empresasDb.push(empresa);
    }
    console.log('✅ Empresas creadas');

    // 3. Vacantes Ficticias
    const vacantesData = [
      {
        id_empresa: empresasDb[0].id_empresa,
        titulo: 'Desarrollador Fullstack Senior',
        descripcion: 'Buscamos un desarrollador experimentado para liderar el equipo técnico. Debe conocer Node.js y React. Se requiere proactividad y excelente trabajo en equipo. Buscamos a alguien apasionado por la tecnología y la innovación continua.',
        habilidades_requeridas: 'React, Node.js, JavaScript, Bases de Datos SQL',
        experiencia_requerida: 4,
        rango_salarial: '8000000-12000000',
        modalidad: 'remoto',
        estado: 'abierta'
      },
      {
        id_empresa: empresasDb[1].id_empresa,
        titulo: 'Ingeniero de Datos / Python',
        descripcion: 'Únete a nuestro equipo de IA. Tu misión será preparar los datos para nuestros modelos predictivos. Requisitos: manejo experto de Python, SQL y habilidades analíticas fuertes.',
        habilidades_requeridas: 'Python, Bases de Datos SQL, Comunicación Asertiva',
        experiencia_requerida: 2,
        rango_salarial: '5000000-7000000',
        modalidad: 'híbrido',
        estado: 'abierta'
      },
      {
        id_empresa: empresasDb[2].id_empresa,
        titulo: 'Gerente de Proyectos TI',
        descripcion: 'Buscamos un líder innato para gestionar nuestros proyectos de transformación digital. Debe tener habilidades excepcionales de liderazgo, comunicación y gestión de equipos.',
        habilidades_requeridas: 'Gestión de Proyectos, Liderazgo, Comunicación Asertiva, Inglés Avanzado',
        experiencia_requerida: 5,
        rango_salarial: '10000000-15000000',
        modalidad: 'presencial',
        estado: 'abierta'
      },
      {
        id_empresa: empresasDb[0].id_empresa,
        titulo: 'Desarrollador Frontend Junior',
        descripcion: 'Excelente oportunidad para iniciar tu carrera. Trabajarás con React y JavaScript creando interfaces de usuario atractivas. Valoramos mucho las ganas de aprender y el trabajo en equipo.',
        habilidades_requeridas: 'React, JavaScript, Trabajo en equipo',
        experiencia_requerida: 0,
        rango_salarial: '2000000-3000000',
        modalidad: 'remoto',
        estado: 'abierta'
      },
      {
        id_empresa: empresasDb[3].id_empresa,
        titulo: 'Diseñador Gráfico Senior',
        descripcion: 'Únete a nuestra agencia creativa. Buscamos un diseñador con excelente manejo de Adobe Illustrator, creatividad desbordante y capacidad de trabajo en equipo para campañas globales.',
        habilidades_requeridas: 'Adobe Illustrator, Trabajo en equipo, Comunicación Asertiva',
        experiencia_requerida: 4,
        rango_salarial: '4000000-6000000',
        modalidad: 'híbrido',
        estado: 'abierta'
      },
      {
        id_empresa: empresasDb[4].id_empresa,
        titulo: 'Ejecutivo de Ventas B2B',
        descripcion: 'Buscamos un líder en ventas para expandir nuestra presencia en el mercado nacional. Se requiere experiencia comprobada en Ventas B2B y excelente atención al cliente.',
        habilidades_requeridas: 'Ventas B2B, Atención al Cliente, Liderazgo',
        experiencia_requerida: 3,
        rango_salarial: '3500000-5500000',
        modalidad: 'presencial',
        estado: 'abierta'
      },
      {
        id_empresa: empresasDb[3].id_empresa,
        titulo: 'Especialista en Marketing Digital',
        descripcion: 'Crea, gestiona y optimiza campañas de marketing digital para marcas reconocidas. Indispensable nivel de inglés avanzado.',
        habilidades_requeridas: 'Marketing Digital, Inglés Avanzado, Trabajo en equipo',
        experiencia_requerida: 2,
        rango_salarial: '4500000-6500000',
        modalidad: 'remoto',
        estado: 'abierta'
      }
    ];

    for (const v of vacantesData) {
      const [vacante] = await Vacante.findOrCreate({
        where: { titulo: v.titulo, id_empresa: v.id_empresa },
        defaults: v
      });

      const skillNames = v.habilidades_requeridas.split(',').map(s => s.trim());
      for (const skillName of skillNames) {
        const skill = await Habilidad.findOne({ where: { nombre: skillName } });
        if (skill) {
          await VacanteHabilidad.findOrCreate({
            where: { id_vacante: vacante.id_vacante, id_habilidad: skill.id_habilidad },
            defaults: { es_obligatoria: true }
          });
        }
      }
    }
    console.log('✅ Vacantes creadas');

    console.log('🎉 Semilla completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error poblando la base de datos:', error);
    process.exit(1);
  }
};

seedData();
