namespace FitnessCenter.Api.Domain;

public class WorkoutProgram
{
    public int Id { get; private set; }

    public int MemberId { get; private set; }
    public Member Member { get; private set; } = null!;

    public int TrainerId { get; private set; }
    public Trainer Trainer { get; private set; } = null!;

    public string Title { get; private set; } = string.Empty;
    public string? Goal { get; private set; }
    public string? Description { get; private set; }
    public int DurationWeeks { get; private set; }
    public string Difficulty { get; private set; } = "BEGINNER";
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public ICollection<WorkoutExercise> Exercises { get; private set; } = new List<WorkoutExercise>();

    private WorkoutProgram() { }

    public WorkoutProgram(Member member, Trainer trainer, string title, string? goal, string? description, int durationWeeks, string difficulty)
    {
        Member = member;
        MemberId = member.Id;
        Trainer = trainer;
        TrainerId = trainer.Id;
        Title = title;
        Goal = goal;
        Description = description;
        DurationWeeks = durationWeeks;
        Difficulty = difficulty;
    }

    public void Update(string title, string? goal, string? description, int durationWeeks, string difficulty, bool isActive)
    {
        Title = title;
        Goal = goal;
        Description = description;
        DurationWeeks = durationWeeks;
        Difficulty = difficulty;
        IsActive = isActive;
    }

    public WorkoutExercise AddExercise(string name, int dayOfWeek, int sets, int reps, decimal? weightKg, int restSeconds, string? notes)
    {
        var exercise = new WorkoutExercise(this, name, dayOfWeek, sets, reps, weightKg, restSeconds, notes);
        Exercises.Add(exercise);
        return exercise;
    }
}

public class WorkoutExercise
{
    public int Id { get; private set; }

    public int WorkoutProgramId { get; private set; }
    public WorkoutProgram WorkoutProgram { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public int DayOfWeek { get; private set; }
    public int Sets { get; private set; }
    public int Reps { get; private set; }
    public decimal? WeightKg { get; private set; }
    public int RestSeconds { get; private set; }
    public string? Notes { get; private set; }

    private WorkoutExercise() { }

    internal WorkoutExercise(WorkoutProgram program, string name, int dayOfWeek, int sets, int reps, decimal? weightKg, int restSeconds, string? notes)
    {
        WorkoutProgram = program;
        Name = name;
        DayOfWeek = Math.Clamp(dayOfWeek, 1, 7);
        Sets = sets;
        Reps = reps;
        WeightKg = weightKg;
        RestSeconds = restSeconds;
        Notes = notes;
    }
}
