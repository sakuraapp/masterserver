# Masterserver
The master server is in charge of deploying room pods and communicating with other services that are part of Sakura's infrastructure.

## Installation
Install the dependencies
```
npm install
```
Copy the `.env.sample` file as `.env`
```
cp .env.sample .env
```
Generate a MaxMind license key on [MaxMind's website](https://www.maxmind.com/en/accounts/current/people/current) for node location data, then add it to your `.env` file
```
MAXMIND_LICENSE_KEY="your key here"
````
Create a Kubernetes service account called `sakura`
```
kubectl create serviceaccount sakura
```

## Usage
```
npm run dev
```