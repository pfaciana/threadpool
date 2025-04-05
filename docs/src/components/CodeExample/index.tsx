import React, { type ReactNode } from 'react'
import Heading from '@theme/Heading'
import Tabs from '@theme/Tabs'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import styles from './styles.module.css'
import TabItem from '@theme/TabItem'

type CodeBlocks = {
	title: string;
	description: ReactNode;
	code: string;
	language: string;
};

export interface CodeExampleProps {
	title: string;
	description: string;
	featuresTitle?: string;
	features: ReactNode[];
	buttonText: string;
	buttonLink: string;
	className?: string;
	defaultValue?: string;
	codeBlocks: CodeBlocks[];
}

function Code({ description, code, language }: CodeBlocks) {
	return (
		<>
			<div className={styles.codeBlockDescription}>{description}</div>
			<CodeBlock language={language}>{code}</CodeBlock>
		</>
	)
}

export default function CodeExample({ title, description, codeBlocks, features, buttonText, buttonLink, className, featuresTitle, defaultValue }: CodeExampleProps): ReactNode {
	return (
		<section className={`${styles.codeExampleSection} ${className || ''}`}>
			<div className="container">
				<div className={styles.sectionHeader}>
					<Heading as="h2">{title}</Heading>
					<p>{description}</p>
				</div>
				<div className="row">
					<div className="col col--7">
						<div className={styles.codeSnippet}>
							<Tabs defaultValue={`${defaultValue ?? `code-block-1`}`}>
								{codeBlocks.map((props, idx) => (
									<TabItem key={idx} value={`code-block-${idx}`} label={props.title}>
										<Code {...props} />
									</TabItem>
								))}
							</Tabs>
						</div>
					</div>
					<div className="col col--5">
						<div className={styles.codeDescription}>
							<Heading as="h3">{featuresTitle}</Heading>
							<ul className={styles.featureList}>
								{features.map((feature, idx) => (
									<li key={idx}>{feature}</li>
								))}
							</ul>
							<Link
								className="button button--outline button--primary"
								to={buttonLink}>
								{buttonText}
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
