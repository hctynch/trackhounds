-- Changes asked for after the first test hunt (docs/FIRST_NOTES.md):
-- hunt details, pack scoring, crosses as rows of their own, special awards.

-- 1. Where the hunt is held and who runs it.
alter table hunt_entity add column city varchar(255);
alter table hunt_entity add column state varchar(255);
alter table hunt_entity add column president varchar(255);
alter table hunt_entity add column master_of_hounds varchar(255);

-- 2. Pack scoring: points count down to a minimum and every later dog gets the minimum.
alter table hunt_entity add column pack_scoring boolean default false not null;
alter table hunt_entity add column pack_minimum_points integer default 15 not null;

-- 3. A cross is one judge's entry at one time on one day. Until now it only existed as the
--    scores that shared those three values; it gets a row so it can be listed, edited and
--    deleted as a whole, and so the order of entry is known.
create table crosses (
    id integer,
    day integer not null,
    judge_number integer not null,
    time time(6),
    primary key (id)
);

alter table score add column cross_id bigint;
alter table score add column cross_position integer default 0 not null;

-- Existing scores: one cross per (day, judge, time), numbered in the order they were entered;
-- the dogs keep their order of entry as their place in the cross.
insert into crosses (day, judge_number, time)
select day, judge_number, time from score group by day, judge_number, time order by min(id);

update score set cross_id = (
    select c.id from crosses c
    where c.day = score.day and c.judge_number = score.judge_number and c.time is score.time);

update score set cross_position = (
    select count(*) from score earlier
    where earlier.cross_id = score.cross_id and earlier.id < score.id);

-- 4. Special awards ("Best Mouth", "Classiest Hound") given to a dog.
create table award (
    id integer,
    dog_number varchar(255),
    notes varchar(255),
    title varchar(255),
    primary key (id)
);
