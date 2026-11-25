/** A chapters file with one interaction cue that matches the snippet's interaction 0, and one that is new. */
export const validVtt = `WEBVTT

NOTE Written by hand

1
00:00:00.000 --> 00:00:20.000
Intro

2
00:00:20.000 --> 01:01.000
Descent

interaction-0
00:00:10.500 --> 00:00:15.000
Neil <b>Armstrong</b>

interaction-7
00:00:40.000 --> 00:00:45.000
A new question
`;

export const noHeaderVtt = `00:00:00.000 --> 00:00:20.000
Intro
`;

export const noCuesVtt = `WEBVTT

NOTE only a note
`;
