# Section 8 current-main integration

Base main HEAD verified at staging: 71aebc598948fc71fd673f3f87697cd8a389a2c0

Includes only the Section 8 replacement at #weddingGift; updates
the two Section 8 stylesheet/script includes; preserves Gallery 7 and
the existing Section 9 RSVP API-backed form and Section 10 closing scene.

Section 8 source: a4f34e96cefa513a15928f8d336bf759b59ccd47
Worker PR: https://github.com/Arrjack8847/testing-4/pull/27

The GitHub Actions integration workflow checks four viewport sizes and
runs the relevant existing Gallery / RSVP / closing regression tests.
Do not redistribute the external downloaded art; the local comparison
files under assets/reference-dev are ignored by main's .gitignore.

The product payment/gift reservation UI is a demonstration and is
disabled unless recipient bank details are explicitly verified. This
integration does not implement payment or reservation backends.

Artwork motion and visual pixel parity are not yet independently certified.
