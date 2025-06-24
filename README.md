## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation

When a todo is created, search for and display a relevant image to visualize the task to be done.

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request.

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution.
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!

## Soulution!!!!

The image of solution is : "Solution SS" attached with this file

So basically, we started off by building a task manager app using React and Prisma with a SQLite database. First we got the basic CRUD stuff working — like creating tasks, deleting them, and showing them on the UI. We added support for due dates and made overdue tasks turn red which was kinda cool.

Then, we hooked up the Pexels API so that whenever a new task is created, the app automatically searches for a relevant image based on the task title. That image shows up with the task to give it some visual meaning. It took a bit of debugging but got it working nicely.

Next, we tackled dependencies. We updated the schema to allow tasks to depend on other tasks. Because we were using SQLite, we had to define the many-to-many relationship manually with a join table (TaskDependency). We made sure to prevent circular dependencies too — like you can’t have task A depend on B and B back on A.

After that, we built a system to calculate each task’s earliest possible start date based on its dependencies. Then, we visualized the whole task dependency structure using React Flow. You can now see all the tasks as nodes with arrows showing how they depend on each other.

Lastly, we cleaned up the UI a bit so that task images show up in the task list (but not in the graph), and added a way to choose dependencies when creating a new task.

Overall, it turned into a pretty solid and interactive task management app with visuals, dates, and dependencies all working together.
