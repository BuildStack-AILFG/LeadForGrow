'use client';



import { motion } from 'framer-motion';

import Image from 'next/image';

import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

import { LANDING } from './landingStyles';

import { LANDING_IMAGES } from './hubspotLandingImages';



const ARTICLES = [

  {

    title: 'LeadForGrow launches AI reply drafting for WhatsApp',

    description:

      'Sales teams can now approve AI-generated WhatsApp replies that match their brand tone — cutting response time without losing the human touch.',

    href: '/resources/blog',

    linkText: 'Read more',

    image: LANDING_IMAGES.article1,

  },

  {

    title: 'Why Meta Lead Ads need instant WhatsApp follow-up',

    description:

      'Our data shows leads contacted within 60 seconds convert 7× more often. Here is how to set up instant routing with LeadForGrow.',

    href: '/resources/blog',

    linkText: 'Read why',

    image: LANDING_IMAGES.article2,

  },



];



export default function WhatsNewSection() {

  return (

    <section className={`${LANDING.section} bg-white`}>

      <div className={LANDING.container}>

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          whileInView={{ opacity: 1, y: 0 }}

          viewport={{ once: true }}

          className="mb-12 max-w-2xl"

        >

          <h2 className={LANDING.heading}>What&apos;s new at LeadForGrow?</h2>

          <p className={`mt-4 ${LANDING.subheading}`}>

            Product updates, insights, and resources to help your team convert more leads.

          </p>

        </motion.div>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {ARTICLES.map((article, i) => (

            <motion.article

              key={article.title}

              initial={{ opacity: 0, y: 24 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.6, delay: i * 0.08 }}

              className={`${LANDING.card} ${LANDING.cardHover} overflow-hidden flex flex-col`}

            >

              <div className="relative h-40">

                <Image

                  src={article.image}

                  alt=""

                  fill

                  className="object-cover"

                  sizes="(max-width: 768px) 100vw, 33vw"

                />

              </div>

              <div className="p-6 flex flex-col flex-1">

                <h3 className="text-base font-bold text-[#33475B] leading-snug">{article.title}</h3>

                <p className="mt-3 flex-1 text-sm text-[#516f90] leading-relaxed">{article.description}</p>

                <Link href={article.href} className={`mt-5 ${LANDING.linkArrow}`}>

                  {article.linkText}

                  <ArrowUpRight className="h-4 w-4" />

                </Link>

              </div>

            </motion.article>

          ))}

        </div>

      </div>

    </section>

  );

}

