-- TrackHounds 3.0 schema, exactly as Hibernate created it (SQLiteDialect, ddl-auto=update).
-- Databases written by 3.0 already have these tables and are baselined at version 1 instead of
-- running this script. Later changes go in V2__*.sql and so on; Hibernate only validates.

create table hunt_entity (
    id integer,
    dates varchar(255),
    first_dog_points integer default 35 not null,
    hunt_days integer default 4 not null,
    hunt_interval integer not null,
    point_step integer default 5 not null,
    stake tinyint check (stake between 0 and 2),
    stake_range blob,
    stake_type_range blob,
    title varchar(255),
    primary key (id)
);

create table judge_entity (
    number integer not null,
    member_pin varchar(255),
    name varchar(255),
    primary key (number)
);

-- Dog numbers are text: "0" and "00" are different dogs.
create table dogs (
    number varchar(255) not null,
    dam varchar(255),
    name varchar(255),
    owner varchar(255),
    points integer not null,
    scratched boolean not null,
    sire varchar(255),
    stake tinyint check (stake between 0 and 2),
    primary key (number)
);

create table days (
    day integer not null,
    start_time time(6),
    primary key (day)
);

create table daily_score (
    id integer,
    associated_points integer not null,
    daily_score integer not null,
    last_cross time(6),
    zero_interval boolean not null,
    day_day integer not null,
    dog_number varchar(255),
    score_order integer,
    primary key (id)
);

create table score (
    id integer,
    counted boolean not null,
    day integer not null,
    dog_number varchar(255),
    judge_number integer not null,
    points integer not null,
    time time(6),
    time_bucket integer not null,
    daily_score_id bigint,
    primary key (id)
);

create table scratch (
    id integer,
    day integer default 1 not null,
    dog_name varchar(255),
    dog_number varchar(255),
    judge_number integer not null,
    reason varchar(255),
    time time(6),
    primary key (id)
);
