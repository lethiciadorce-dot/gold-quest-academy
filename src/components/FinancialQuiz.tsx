import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coins, Trophy, Zap, Target, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: 'money' | 'income' | 'expenses';
  difficulty: 1 | 2 | 3 | 4 | 5;
  souls: number;
}

const questions: Question[] = [
  {
    id: 1,
    question: "O que é dinheiro na analogia de um jogo Souls-like?",
    options: [
      "Apenas papel sem valor",
      "Souls/XP que você coleta para evoluir seu personagem",
      "Um item cosmético",
      "Uma arma especial"
    ],
    correct: 1,
    category: 'money',
    difficulty: 1,
    souls: 100
  },
  {
    id: 2,
    question: "Qual a principal diferença entre dinheiro físico e digital?",
    options: [
      "Dinheiro digital não tem valor real",
      "Dinheiro físico é mais seguro",
      "Praticidade vs. tangibilidade, ambos têm valor",
      "Não há diferença"
    ],
    correct: 2,
    category: 'money',
    difficulty: 2,
    souls: 200
  },
  {
    id: 3,
    question: "Na analogia gamer, o que representa o 'farm de gold'?",
    options: [
      "Gastar dinheiro rapidamente",
      "Diferentes formas de ganhar renda",
      "Economizar dinheiro",
      "Investir em ações"
    ],
    correct: 1,
    category: 'income',
    difficulty: 2,
    souls: 200
  },
  {
    id: 4,
    question: "Qual destes é um exemplo de 'quest diária' para gerar renda?",
    options: [
      "Dormir até tarde",
      "Pequenos trabalhos ou responsabilidades regulares",
      "Assistir TV",
      "Jogar videogame"
    ],
    correct: 1,
    category: 'income',
    difficulty: 1,
    souls: 150
  },
  {
    id: 5,
    question: "Gastos fixos em um RPG seriam como:",
    options: [
      "Compras de poções ocasionais",
      "Aluguel de um local para guardar itens todo mês",
      "Drops aleatórios",
      "Bônus especiais"
    ],
    correct: 1,
    category: 'expenses',
    difficulty: 2,
    souls: 200
  },
  {
    id: 6,
    question: "Qual item seria considerado 'essencial' vs 'cosmético'?",
    options: [
      "Roupas de marca são essenciais",
      "Comida é cosmética, roupas são essenciais",
      "Comida é essencial, roupas de marca são cosméticas",
      "Tudo é cosmético"
    ],
    correct: 2,
    category: 'expenses',
    difficulty: 3,
    souls: 300
  },
  {
    id: 7,
    question: "Como o PIX se relaciona com a evolução do dinheiro?",
    options: [
      "É apenas uma moda passageira",
      "Representa a evolução digital do dinheiro, como upgrade de equipamento",
      "É inferior ao dinheiro físico",
      "Não tem relação com dinheiro real"
    ],
    correct: 1,
    category: 'money',
    difficulty: 3,
    souls: 300
  },
  {
    id: 8,
    question: "Que tipo de 'drop raro' representaria um presente inesperado?",
    options: [
      "Salário mensal",
      "Mesada regular",
      "Dinheiro de aniversário",
      "Pagamento de trabalho fixo"
    ],
    correct: 2,
    category: 'income',
    difficulty: 2,
    souls: 250
  },
  {
    id: 9,
    question: "Gastos que 'drenam sua stamina' rapidamente seriam:",
    options: [
      "Compras planejadas e necessárias",
      "Gastos impulsivos e desnecessários",
      "Investimentos em educação",
      "Poupança mensal"
    ],
    correct: 1,
    category: 'expenses',
    difficulty: 3,
    souls: 350
  },
  {
    id: 10,
    question: "O que representa uma 'Bonfire' no contexto financeiro?",
    options: [
      "Local onde você gasta todo seu dinheiro",
      "Ponto de descanso onde você deposita dinheiro para não perder",
      "Lugar para emprestar dinheiro",
      "Local de trabalho"
    ],
    correct: 1,
    category: 'money',
    difficulty: 4,
    souls: 400
  }
];

const FinancialQuiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [totalSouls, setTotalSouls] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const isCorrect = answerIndex === currentQ.correct;
    
    if (isCorrect) {
      setTotalSouls(prev => prev + currentQ.souls);
      toast({
        title: "🎉 Resposta Correta!",
        description: `+${currentQ.souls} Souls coletadas!`,
        className: "border-xp-green bg-card"
      });
    } else {
      toast({
        title: "❌ Resposta Incorreta",
        description: "Tente novamente na próxima quest!",
        variant: "destructive"
      });
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameState('finished');
      }
    }, 2000);
  };

  const restartGame = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setTotalSouls(0);
    setGameState('start');
    setShowResult(false);
  };

  const startGame = () => {
    setGameState('playing');
  };

  const getRank = () => {
    if (totalSouls >= 2000) return { title: "💎 Mestre das Finanças", color: "text-souls-glow" };
    if (totalSouls >= 1500) return { title: "🏆 Expert Financeiro", color: "text-gold-glow" };
    if (totalSouls >= 1000) return { title: "⭐ Guerreiro das Souls", color: "text-xp-green" };
    if (totalSouls >= 500) return { title: "🎯 Aprendiz Valente", color: "text-warning-orange" };
    return { title: "🌟 Iniciante Corajoso", color: "text-foreground" };
  };

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-4 sm:p-6 md:p-8 text-center bg-card/90 backdrop-blur-sm border-primary/20">
          <div className="animate-bounce-in">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-souls bg-clip-text text-transparent mb-4">
              Gold Quest Academy
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
              Teste seus conhecimentos sobre o jogo da vida financeira!
            </p>
            
            {/* Mobile: Stack vertically below 768px */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex flex-col items-center p-3 sm:p-4 bg-secondary/50 rounded-lg min-h-[80px]">
                <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-gold mb-2" />
                <span className="text-xs sm:text-sm font-medium">10 Questões</span>
              </div>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-secondary/50 rounded-lg min-h-[80px]">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-souls mb-2" />
                <span className="text-xs sm:text-sm font-medium">Souls para coletar</span>
              </div>
              <div className="flex flex-col items-center p-3 sm:p-4 bg-secondary/50 rounded-lg min-h-[80px]">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-xp-green mb-2" />
                <span className="text-xs sm:text-sm font-medium">Rankings</span>
              </div>
            </div>
            
            {/* Full width CTA below 480px */}
            <Button 
              onClick={startGame}
              variant="default"
              size="lg"
              className="w-full sm:w-auto bg-gradient-primary hover:bg-gradient-souls shadow-glow animate-glow-pulse text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 min-h-[48px]"
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Iniciar Quest Financeira
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'finished') {
    const rank = getRank();
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-4 sm:p-6 md:p-8 text-center bg-card/90 backdrop-blur-sm border-primary/20">
          <div className="animate-bounce-in">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gold mx-auto mb-4 animate-gold-shine" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Quest Completa!</h2>
            
            <div className="bg-secondary/50 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-gold mr-2" />
                <span className="text-2xl sm:text-3xl font-bold text-gold">{totalSouls}</span>
                <span className="text-sm sm:text-lg text-muted-foreground ml-2">Souls</span>
              </div>
              
              <h3 className={`text-lg sm:text-xl font-bold ${rank.color} mb-2`}>
                {rank.title}
              </h3>
              
              <Progress 
                value={(totalSouls / 2500) * 100} 
                className="h-2 sm:h-3 bg-secondary"
              />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {totalSouls}/2500 Souls para o próximo nível
              </p>
            </div>
            
            {/* Mobile: Stack stats vertically below 480px */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-secondary/30 rounded-lg p-3 sm:p-4 min-h-[80px] flex flex-col justify-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-xp-green mx-auto mb-2" />
                <div className="text-base sm:text-lg font-bold">{questions.filter((q, i) => answeredQuestions[i]).length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Questões</div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 sm:p-4 min-h-[80px] flex flex-col justify-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-souls mx-auto mb-2" />
                <div className="text-base sm:text-lg font-bold">{Math.round((totalSouls / (questions.reduce((acc, q) => acc + q.souls, 0))) * 100)}%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Eficiência</div>
              </div>
            </div>
            
            {/* Full width CTA */}
            <Button 
              onClick={restartGame}
              variant="default"
              size="lg"
              className="w-full bg-gradient-primary hover:bg-gradient-souls shadow-glow text-base sm:text-lg px-6 py-4 min-h-[48px]"
            >
              Nova Quest
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Mobile-optimized Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-gold animate-gold-shine" />
            <span className="text-xl sm:text-2xl font-bold text-gold">{totalSouls}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">Souls</span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Questão</span>
            <span className="text-base sm:text-lg font-bold">{currentQuestion + 1}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-base sm:text-lg">{questions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <Progress 
            value={progress} 
            className="h-2 sm:h-3 bg-secondary"
          />
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
            Progresso da Quest: {Math.round(progress)}%
          </p>
        </div>

        {/* Question Card - Reduced padding on mobile */}
        <Card className="p-4 sm:p-6 md:p-8 bg-card/90 backdrop-blur-sm border-primary/20 animate-slide-up">
          <div className="mb-4 sm:mb-6">
            {/* Category and souls - Stack on very small screens */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 mb-3 sm:mb-4">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                currentQ.category === 'money' ? 'bg-souls/20 text-souls-glow' :
                currentQ.category === 'income' ? 'bg-gold/20 text-gold-glow' :
                'bg-xp-green/20 text-xp-green'
              }`}>
                {currentQ.category === 'money' ? '💰 Dinheiro' :
                 currentQ.category === 'income' ? '⚡ Renda' : '💸 Gastos'}
              </span>
              
              <div className="flex items-center space-x-1">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                <span className="text-xs sm:text-sm font-bold text-gold">+{currentQ.souls}</span>
              </div>
            </div>
            
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {/* Answer buttons - Always stack on mobile */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {currentQ.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`p-3 sm:p-4 h-auto text-left justify-start transition-all duration-300 min-h-[48px] ${
                  showResult ? 
                    index === currentQ.correct ? 
                      'bg-xp-green/20 border-xp-green text-xp-green' :
                      selectedAnswer === index ?
                        'bg-danger-red/20 border-danger-red text-danger-red' :
                        'opacity-50' :
                    'hover:bg-primary/10 hover:border-primary hover:shadow-glow'
                }`}
              >
                <span className="text-sm sm:text-base font-medium leading-relaxed">
                  {option}
                </span>
              </Button>
            ))}
          </div>

          {showResult && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg animate-bounce-in">
              {selectedAnswer === currentQ.correct ? (
                <div className="bg-xp-green/10 border border-xp-green/30 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-xp-green mb-2 text-sm sm:text-base">🎉 Correto!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Você coletou {currentQ.souls} Souls! Continue assim, guerreiro!
                  </p>
                </div>
              ) : (
                <div className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-danger-red mb-2 text-sm sm:text-base">💀 Incorreto!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    A resposta correta era: <span className="font-bold text-xp-green">{currentQ.options[currentQ.correct]}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FinancialQuiz;