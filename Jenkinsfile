pipeline {
    agent any

    environment {
        PYTHON_VENV = "venv"
        ALLURE_RESULTS = "allure-results"
        ALLURE_REPORT = "allure-report"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'git@github.com:swatidhoke/Playwright_python.git',
                    credentialsId: 'github-ssh-key'
            }
        }

        stage('Setup Python') {
            steps {
                sh 'python3 -m venv $PYTHON_VENV'
                sh '. $PYTHON_VENV/bin/activate && pip install --upgrade pip'
                sh '. $PYTHON_VENV/bin/activate && pip install -r requirements.txt'
            }
        }

        stage('Run Playwright Tests') {
            steps {
                sh '. $PYTHON_VENV/bin/activate && pytest --alluredir=$ALLURE_RESULTS'
            }
        }

        stage('Generate Allure Report') {
            steps {
                sh 'allure generate $ALLURE_RESULTS --clean -o $ALLURE_REPORT || true'
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '$ALLURE_REPORT/**', fingerprint: true
                archiveArtifacts artifacts: '$ALLURE_RESULTS/**', fingerprint: true
            }
        }

        stage('Publish Allure Report') {
            steps {
                allure results: [[path: ALLURE_RESULTS]], reportBuildPolicy: 'ALWAYS'
            }
        }
    }

    post {
        always {
            echo "Build finished: ${currentBuild.fullDisplayName}"
        }
        failure {
            mail to: 'swatidhoke@gmail.com',
                 subject: "Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Check Jenkins for details."
        }
    }
}
