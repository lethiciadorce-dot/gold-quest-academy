import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Coins, Trophy, Zap, Target, Star, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  category: 'money' | 'income' | 'expenses';
  difficulty: 1 | 2 | 3 | 4 | 5;
  souls: number;
  order_position: number;
}

interface QuizScore {
  id: string;
  player_name: string;
  score: number;
  completed_at: string;
}

// Questions will be loaded from database

const FinancialQuiz: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [totalSouls, setTotalSouls] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished' | 'ranking'>('start');
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [ranking, setRanking] = useState<QuizScore[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentQ = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Load questions from database
  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      
      const formattedQuestions: Question[] = (data || []).map(q => ({
        id: q.id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
        correct_index: q.correct_index,
        category: q.category as 'money' | 'income' | 'expenses',
        difficulty: q.difficulty as 1 | 2 | 3 | 4 | 5,
        souls: q.souls,
        order_position: q.order_position,
      }));
      
      setQuestions(formattedQuestions);
      setAnsweredQuestions(new Array(formattedQuestions.length).fill(false));
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Erro ao carregar perguntas',
        description: 'Não foi possível carregar as perguntas do quiz',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Load questions and set up realtime updates
  useEffect(() => {
    loadQuestions();

    const channel = supabase
      .channel('questions-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions'
        },
        () => {
          loadQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const isCorrect = answerIndex === currentQ.correct_index;
    
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
    
    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        await saveScore();
        setGameState('ranking');
      }
    }, 2000);
  };

  const saveScore = async () => {
    if (!playerName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('quiz_scores')
        .insert([
          {
            player_name: playerName.trim(),
            score: totalSouls
          }
        ]);

      if (error) throw error;

      toast({
        title: "🏆 Pontuação Salva!",
        description: "Seu resultado foi adicionado ao ranking!",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving score:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao salvar pontuação. Tente novamente.",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const restartGame = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setTotalSouls(0);
    setGameState('start');
    setShowResult(false);
    setPlayerName("");
    setAnsweredQuestions(new Array(questions.length).fill(false));
  };

  const startGame = () => {
    if (playerName.trim()) {
      setGameState('playing');
    } else {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome para começar!",
        duration: 2000,
      });
    }
  };

  const loadRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .order('score', { ascending: false })
        .order('completed_at', { ascending: true });

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error('Error loading ranking:', error);
    }
  };

  // Load ranking when component mounts and set up realtime subscription
  useEffect(() => {
    loadRanking();

    const channel = supabase
      .channel('quiz-ranking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_scores'
        },
        () => {
          loadRanking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load ranking when entering ranking screen
  useEffect(() => {
    if (gameState === "ranking") {
      loadRanking();
    }
  }, [gameState]);

  const getRank = () => {
    if (totalSouls >= 2000) return { title: "💎 Mestre das Finanças", color: "text-souls-glow" };
    if (totalSouls >= 1500) return { title: "🏆 Expert Financeiro", color: "text-gold-glow" };
    if (totalSouls >= 1000) return { title: "⭐ Guerreiro das Souls", color: "text-xp-green" };
    if (totalSouls >= 500) return { title: "🎯 Aprendiz Valente", color: "text-warning-orange" };
    return { title: "🌟 Iniciante Corajoso", color: "text-foreground" };
  };

  // Show loading state while questions are being fetched
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Carregando perguntas...</p>
        </div>
      </div>
    );
  }

  // Show message if no questions available
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center bg-card/90 backdrop-blur-sm border-primary/20">
          <h2 className="text-2xl font-bold mb-4">Nenhuma pergunta disponível</h2>
          <p className="text-muted-foreground">
            O quiz ainda não possui perguntas cadastradas. Entre em contato com o administrador.
          </p>
        </Card>
      </div>
    );
  }

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Link 
          to="/admin-login" 
          className="fixed top-4 right-4 p-2 rounded-full bg-card/50 hover:bg-card/80 backdrop-blur-sm border border-border/50 transition-all z-50"
          aria-label="Admin"
        >
          <Shield className="w-5 h-5 text-muted-foreground" />
        </Link>
        <Card className="max-w-2xl w-full p-4 sm:p-6 md:p-8 text-center bg-card/90 backdrop-blur-sm border-primary/20">
          <div className="animate-bounce-in">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-souls bg-clip-text text-transparent mb-4">
              Gold Quest Academy
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
              Teste seus conhecimentos sobre o jogo da vida financeira!
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <label htmlFor="playerName" className="block text-lg font-semibold text-primary mb-2">
                  Digite seu nome para começar:
                </label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Seu nome aqui..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="text-center text-lg bg-secondary/50 border-primary/30"
                  onKeyPress={(e) => e.key === 'Enter' && startGame()}
                />
              </div>
            </div>
            
            {/* Mobile: Stack vertically below 768px */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex flex-col items-center p-3 sm:p-4 bg-secondary/50 rounded-lg min-h-[80px]">
                <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-gold mb-2" />
                <span className="text-xs sm:text-sm font-medium break-words text-center">
                  {questions.length} {questions.length === 1 ? 'Questão' : 'Questões'}
                </span>
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
              disabled={!playerName.trim()}
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Iniciar Quest Financeira
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'ranking') {
    const currentPlayerRank = ranking.findIndex(score => 
      score.player_name === playerName && 
      Math.abs(score.score - totalSouls) < 10 && 
      Date.now() - new Date(score.completed_at).getTime() < 60000
    ) + 1;
    
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-4 sm:p-6 md:p-8 bg-card/90 backdrop-blur-sm border-primary/20">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-souls bg-clip-text text-transparent">
              🏆 Ranking ao Vivo
            </h1>
            {currentPlayerRank > 0 && (
              <p className="text-lg text-primary">
                <span className="font-bold">{playerName}</span>, você ficou em <span className="font-bold text-gold">#{currentPlayerRank}</span> com {totalSouls} Souls!
              </p>
            )}
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="max-h-96 overflow-y-auto">
              {ranking.length === 0 ? (
                <p className="text-center text-muted-foreground">Carregando ranking...</p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((score, index) => (
                    <div 
                      key={score.id}
                      className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all ${
                        score.player_name === playerName && 
                        Math.abs(score.score - totalSouls) < 10 && 
                        Date.now() - new Date(score.completed_at).getTime() < 60000
                          ? 'bg-gradient-to-r from-primary/20 to-gold/20 border-2 border-gold/50'
                          : 'bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`text-xl sm:text-2xl font-bold ${
                          index === 0 ? 'text-gold' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-400' :
                          'text-muted-foreground'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-lg sm:text-xl font-semibold text-foreground">
                          {score.player_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg sm:text-xl font-bold text-gold">
                          {score.score}
                        </span>
                        <span className="text-muted-foreground">Souls</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={restartGame}
                size="lg"
                className="w-full sm:w-auto bg-gradient-primary hover:bg-gradient-souls shadow-glow text-base sm:text-lg px-6 py-4 min-h-[48px]"
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Jogar Novamente
              </Button>
            </div>
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
                    index === currentQ.correct_index ? 
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
              {selectedAnswer === currentQ.correct_index ? (
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
                    A resposta correta era: <span className="font-bold text-xp-green">{currentQ.options[currentQ.correct_index]}</span>
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