
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Test Backend') {
            steps {
                dir('backend') {
                    bat 'mvnw.cmd -B clean verify'
                }
            }
        }
    }

    post {
        success {
            echo 'BookTrack backend build and tests passed!'
        }

        failure {
            echo 'Build or tests failed. Check the console output.'
        }
    }
}
