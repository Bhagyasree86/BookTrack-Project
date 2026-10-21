pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'mvnw.cmd -B -DskipTests package'
                }
            }
        }
    }

    post {
        success {
            echo 'BookTrack backend build completed successfully!'
        }

        failure {
            echo 'Build failed. Check the Jenkins console output.'
        }
    }
}
