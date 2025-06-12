# AEMS React User Interface

AEMS app is a core set of utilities and patterns used to bootstrap the creation of a React client and server web based application.

### Prerequesites

These applications should be installed on the host machine.

- [Git](https://git-scm.com/) - required
- [Sourcetree](https://www.sourcetreeapp.com/) - optional
- [Visual Studio Code](https://code.visualstudio.com/) - optional
- [Node.js](https://nodejs.org/) - required (version 16.13.2)
- [NVM](https://github.com/nvm-sh/nvm) - optional `for managing multiple versions of Node.js`
- [Yarn](https://classic.yarnpkg.com/) - required
- [Docker-Desktop](https://www.docker.com/products/docker-desktop) - optional `or Docker and Docker-Compose`
- [Docker](https://www.docker.com/products/container-runtime) - optional
- [Docker-Compose](https://docs.docker.com/compose/install/) - optional

### Installation

Download the AEMS application source code from the PNNL BitBucket repository.

- [BitBucket](https://stash.pnnl.gov)

If Git is installed you can checkout directly from BitBucket (Stash) which will make updating to the latest release easier. You will only have to clone the repository once. After that you can pull to get the latest updates. Every time the application is updated you'll need to go through the build process.

```bash
git clone https://stash.pnnl.gov
```

It's recommended to use the latest stable release from the main branch for deployments...

```bash
git checkout main
```

...and develop for development.

```bash
git checkout develop
```

### Updating

If you downloaded directly from the BitBucket site then you will need to repeat all steps in this guide as you would for a new installation. If you cloned from BitBucket then follow these steps. This will stash your configuration changes, update to the latest, and then re-apply your configuration to the updated files.

```bash
git stash
git pull
git stash pop
```

### Building

If build errors occur it is very likely that Node.js or Yarn is out of date. The following steps assumes the user is in the root directory of the application.

Install or update all of the dependencies for the client. If the yarn install command fails it will often succeed when running it again.

```bash
yarn install
```

Build and deploy the client application to the server directory. Deploy will only work if this source was checked out as a submodule within the AEMS project.

```bash
yarn build
yarn deploy
```

Or alternately use this command to build and deploy with one command.

```bash
yarn package
```

### Client Configuration

The client configuration must be edited before building and deploying. The primary configuration file used for the client is `.env.production`. Changes to the client configuration should be made using an additional file with a `.local` file extension.

If the client is not going to be deployed to a base URL (E.g. https://pnl.gov/example instead of https://example.pnl.gov) then the `homepage` attribute in `package.json` will need to be set accordingly.

> <b>Note:</b> Only configuration that differs from the base configuration file should be specified in a local configuration file.

#### Client

- REACT_APP_TITLE: The title of the application.
- REACT_APP_DESCRIPTION: The description for the application.
- REACT_APP_API_URL: The relative path of the server API.
- REACT_APP_MOCK: Set to true to use the test mock data for API server calls.
- REACT_APP_POLLING: The length of time (in milliseconds) to pause between poll requests.
- REACT_APP_DEBOUNCE: The length of time (in milliseconds) to wait before submitting a debounced request.
- REACT_APP_NOTICE: Set to true to display the government notice.
- REACT_APP_LOGIN: Set to true to enable user login so the client can authenticate with the server.

### Running

To start the server issue the following command.

```bash
yarn start
```

Type `CTRL-C` to stop the server.

### Development

We will be using Gitflow as a source code repository branching model. This particular workflow has fallen out of favor within corporate CI Devops environments, but still works well within PNNL's matrixed environment. You can read more about it here: [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

All development should be done within a feature branch (where `<feature_branch_name>` is the name of the branch to create).

```bash
git checkout develop
git pull
git checkout -b feature/<feature_branch_name>
```

When finished format all of the source code, run the tests, commit all of your changes (using appropriate commit messages), push your changes, and create a merge request for your branch using this link: [Merge Request](https://gitlab.pnnl.gov/AEMS/react/-/merge_requests)

```bash
yarn prettier
yarn test
git commit -a -m "<commit_messages>"
git push
```

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:5580](http://localhost:5580) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn coverage`

Launches the test runner and outputs code coverage results.

### `yarn prettier`

Formats all of the source code.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn deploy`

Moves the built app to the server. This will only work when this is included as a submodule within the AEMS codebase.

### `yarn package`

Runs the build and deploy step together.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
