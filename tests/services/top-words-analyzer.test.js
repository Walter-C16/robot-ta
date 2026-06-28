const TopWordsAnalyzer = require("../../src/services/TopWordsAnalyzer");

describe("TopWordsAnalyzer", () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new TopWordsAnalyzer();
  });

  test("devuelve las palabras más frecuentes", () => {
    const text = "universidad pilar universidad software pilar universidad";

    const result = analyzer.getTopWords(text, 3);

    expect(result).toEqual([
      { word: "universidad", frequency: 3 },
      { word: "pilar", frequency: 2 },
      { word: "software", frequency: 1 },
    ]);
  });

  test("respeta el límite indicado", () => {
    const text = "robot robot analisis analisis web universidad";

    const result = analyzer.getTopWords(text, 2);

    expect(result).toEqual([
      { word: "analisis", frequency: 2 },
      { word: "robot", frequency: 2 },
    ]);
  });

  test("ordena alfabéticamente cuando hay empate de frecuencia", () => {
    const text = "zeta alfa beta";

    const result = analyzer.getTopWords(text, 3);

    expect(result).toEqual([
      { word: "alfa", frequency: 1 },
      { word: "beta", frequency: 1 },
      { word: "zeta", frequency: 1 },
    ]);
  });

  test("ignora stop words en español", () => {
    const text = "la universidad de pilar y el desarrollo de software";

    const result = analyzer.getTopWords(text, 10);

    expect(result).toEqual([
      { word: "desarrollo", frequency: 1 },
      { word: "pilar", frequency: 1 },
      { word: "software", frequency: 1 },
      { word: "universidad", frequency: 1 },
    ]);
  });

  test("ignora stop words en inglés", () => {
    const text = "the service and the robot with the analyzer";

    const result = analyzer.getTopWords(text, 10);

    expect(result).toEqual([
      { word: "analyzer", frequency: 1 },
      { word: "robot", frequency: 1 },
      { word: "service", frequency: 1 },
    ]);
  });

  test("normaliza mayúsculas y acentos", () => {
    const text = "Educación educación EDUCACION automatización automatizacion";

    const result = analyzer.getTopWords(text, 10);

    expect(result).toEqual([
      { word: "educacion", frequency: 3 },
      { word: "automatizacion", frequency: 2 },
    ]);
  });

  test("ignora números puros", () => {
    const text = "2024 2025 universidad universidad software";

    const result = analyzer.getTopWords(text, 10);

    expect(result).toEqual([
      { word: "universidad", frequency: 2 },
      { word: "software", frequency: 1 },
    ]);
  });

  test("ignora palabras demasiado cortas", () => {
    const text = "ia ux ui web web robot";

    const result = analyzer.getTopWords(text, 10);

    expect(result).toEqual([
      { word: "web", frequency: 2 },
      { word: "robot", frequency: 1 },
    ]);
  });

  test("devuelve array vacío si el texto está vacío", () => {
    const result = analyzer.getTopWords("", 10);

    expect(result).toEqual([]);
  });

  test("devuelve array vacío si el texto no es string", () => {
    const result = analyzer.getTopWords(null, 10);

    expect(result).toEqual([]);
  });

  test("usa límite por defecto si el límite no es válido", () => {
    const text = `
      uno dos tres cuatro cinco seis siete ocho nueve diez once doce
      robot robot robot
    `;

    const result = analyzer.getTopWords(text, "invalid");

    expect(result.length).toBeLessThanOrEqual(10);
    expect(result[0]).toEqual({
      word: "robot",
      frequency: 3,
    });
  });

  test("devuelve array vacío si el límite es negativo", () => {
    const result = analyzer.getTopWords("robot robot universidad", -1);

    expect(result).toEqual([]);
  });
});
