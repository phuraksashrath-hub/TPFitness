using FitnessCenter.Api.Common;
using FitnessCenter.Api.Data;
using FitnessCenter.Api.Domain;
using FitnessCenter.Api.Dtos;
using FitnessCenter.Api.Mapping;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.Api.Services;

public interface IProgramService
{
    Task<IReadOnlyList<WorkoutProgramDto>> GetForMemberAsync(int memberId, CancellationToken ct = default);
    Task<IReadOnlyList<WorkoutProgramDto>> GetForTrainerAsync(int trainerId, CancellationToken ct = default);
    Task<WorkoutProgramDto> CreateAsync(int trainerId, SaveWorkoutProgramRequest request, CancellationToken ct = default);
    Task<WorkoutProgramDto> UpdateAsync(int trainerId, int programId, SaveWorkoutProgramRequest request, CancellationToken ct = default);
    Task DeleteAsync(int trainerId, int programId, CancellationToken ct = default);
}

public class ProgramService : IProgramService
{
    private readonly AppDbContext _db;

    public ProgramService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<WorkoutProgramDto>> GetForMemberAsync(int memberId, CancellationToken ct = default)
    {
        var programs = await BaseQuery().Where(p => p.MemberId == memberId)
            .OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        return programs.Select(p => p.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<WorkoutProgramDto>> GetForTrainerAsync(int trainerId, CancellationToken ct = default)
    {
        var programs = await BaseQuery().Where(p => p.TrainerId == trainerId)
            .OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        return programs.Select(p => p.ToDto()).ToList();
    }

    public async Task<WorkoutProgramDto> CreateAsync(int trainerId, SaveWorkoutProgramRequest request, CancellationToken ct = default)
    {
        var trainer = await _db.Trainers.FirstOrDefaultAsync(t => t.Id == trainerId, ct)
            ?? throw DomainException.NotFound("เทรนเนอร์");

        var member = await _db.Members.FirstOrDefaultAsync(m => m.Id == request.MemberId, ct)
            ?? throw DomainException.NotFound("สมาชิก");

        var program = new WorkoutProgram(member, trainer, request.Title, request.Goal,
            request.Description, request.DurationWeeks, request.Difficulty);

        foreach (var e in request.Exercises ?? Array.Empty<SaveWorkoutExerciseRequest>())
            program.AddExercise(e.Name, e.DayOfWeek, e.Sets, e.Reps, e.WeightKg, e.RestSeconds, e.Notes);

        _db.WorkoutPrograms.Add(program);
        await _db.SaveChangesAsync(ct);

        return (await BaseQuery().FirstAsync(p => p.Id == program.Id, ct)).ToDto();
    }

    public async Task<WorkoutProgramDto> UpdateAsync(int trainerId, int programId, SaveWorkoutProgramRequest request, CancellationToken ct = default)
    {
        var program = await _db.WorkoutPrograms
            .Include(p => p.Exercises)
            .FirstOrDefaultAsync(p => p.Id == programId, ct)
            ?? throw DomainException.NotFound("โปรแกรมฝึก");

        if (program.TrainerId != trainerId)
            throw DomainException.Forbidden("เฉพาะผู้สร้างโปรแกรมเท่านั้นที่แก้ไขได้");

        program.Update(request.Title, request.Goal, request.Description, request.DurationWeeks, request.Difficulty, true);

        _db.WorkoutExercises.RemoveRange(program.Exercises);
        program.Exercises.Clear();

        foreach (var e in request.Exercises ?? Array.Empty<SaveWorkoutExerciseRequest>())
            program.AddExercise(e.Name, e.DayOfWeek, e.Sets, e.Reps, e.WeightKg, e.RestSeconds, e.Notes);

        await _db.SaveChangesAsync(ct);
        return (await BaseQuery().FirstAsync(p => p.Id == programId, ct)).ToDto();
    }

    public async Task DeleteAsync(int trainerId, int programId, CancellationToken ct = default)
    {
        var program = await _db.WorkoutPrograms.FirstOrDefaultAsync(p => p.Id == programId, ct)
            ?? throw DomainException.NotFound("โปรแกรมฝึก");

        if (program.TrainerId != trainerId)
            throw DomainException.Forbidden("เฉพาะผู้สร้างโปรแกรมเท่านั้นที่ลบได้");

        _db.WorkoutPrograms.Remove(program);
        await _db.SaveChangesAsync(ct);
    }

    private IQueryable<WorkoutProgram> BaseQuery() =>
        _db.WorkoutPrograms
            .Include(p => p.Member)
            .Include(p => p.Trainer)
            .Include(p => p.Exercises)
            .AsQueryable();
}
