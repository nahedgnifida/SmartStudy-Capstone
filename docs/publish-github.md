# Publish this Git project before Unit 3 submission

The ZIP includes a real local Git repository with `main` and `development` branches and saved commits. It has **not** been published to GitHub or GitLab.

1. Extract this ZIP without deleting the hidden `.git` directory.
2. Sign into the student’s own GitHub or GitLab account (use the intended submitting student’s account).
3. Create a new **empty repository** named `smartstudy-msit5910` (do not initialize with a README).
4. Open a terminal in `SmartStudy_Unit3_Repository` (the directory containing `.git`).
5. Configure the intended student's author information for new commits if necessary, using the actual values (not the local placeholder):
   `git config user.name "YOUR_REAL_NAME"`
   `git config user.email "YOUR_REAL_EMAIL"`
6. Add the remote URL displayed by GitHub: `git remote add origin https://github.com/YOUR_USERNAME/smartstudy-msit5910.git`
7. Upload both branches: `git push -u origin main` and `git push -u origin development`.
8. Verify the URL in a logged-out browser if it is public, or explicitly grant the instructor appropriate viewer access if private.
9. Replace “Repository URL: Not yet available” in the Questions 1–2 Word document with the **actual verified link**.
10. Confirm both branches and commit history are visible online before submitting.

The course also specifies an official technical-report Word template. If accessible in Brightspace, use it for the Question 3 text before submitting.
